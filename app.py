from flask import Flask, request, jsonify, send_file
from flask import render_template
import gensim.models.keyedvectors as word2vec
from gensim.similarities.index import AnnoyIndexer
from flask import jsonify
from numpy.linalg import norm
import pandas as pd
from sklearn.decomposition import PCA
from numpy.linalg import inv
import numpy as np
from gensim.models import KeyedVectors
from gensim.scripts.glove2word2vec import glove2word2vec
from termcolor import colored
from scipy.spatial.distance import cosine
import json
from datetime import datetime
import os
from flask import make_response
from functools import wraps, update_wrapper


app = Flask(__name__, template_folder='templates')

language = "en"
df, df_tar, model = None, None, None
gender_bias = [("he","him","boy"),("she","her","girl")]
eco_bias = [("rich","wealthy"),("poor","impoverished")]
race_bias = [("african","black"),("european","white")]
bias_words = [gender_bias, eco_bias, race_bias]

@app.route('/setModelBackup/<name>')
def setModelBackup(name="Word2Vec"):
    global model, df
    model =  word2vec.KeyedVectors.load_word2vec_format('./data/word_embeddings/word2vec_50k.bin', binary=True)
    #df = pd.read_csv("./data/bias.csv",header=0, keep_default_na=False)
    df = pd.read_csv("./data/all_biases_10k.csv",header=0, keep_default_na=False)
    print(len(df))
    df = df
    return "success"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/biasViz')
def biasViz():
    setModelBackup()
    return render_template('biasViz.html')

@app.route('/setModel')
def setModel():
    global model, df, language
    name = request.args.get("embedding")
    print("Embedding name: ", name)
    if name=="Word2Vec":
        # print("word2vec model being loaded !!!")
        language = 'en'
        #model =  word2vec.KeyedVectors.load_word2vec_format('./data/word_embeddings/GoogleNews-vectors-negative300.bin', binary=True, limit=50000) 
        model =  word2vec.KeyedVectors.load_word2vec_format('./data/word_embeddings/word2vec_50k.bin', binary=True, limit=50000) 
    elif name=="Glove (wiki 300d)":
        # print("Glove word embedding backend")
        language = 'en'
        model = KeyedVectors.load_word2vec_format('./data/word_embeddings/glove.wikipedia.bin', binary=True, limit=50000) #   
    elif name=="Word2Vec debiased":
        # print('./data/word_embeddings/GoogleNews-vectors-negative300-hard-debiased.bin')
        language = 'en'
        model = KeyedVectors.load_word2vec_format('./data/word_embeddings/GoogleNews-vectors-negative300-hard-debiased.bin', binary=True, limit=50000) 
    elif name=="French fastText":
        # print("French fastText embedding backend")
        language = 'fr'
        model = KeyedVectors.load_word2vec_format('./data/word_embeddings/french.fastText.bin', binary=True, limit=50000)
    elif name=="Hindi fastText":
        # print("Hindi fastText embedding backend")
        language = 'hi'
        model = KeyedVectors.load_word2vec_format('./data/word_embeddings/hindi.fastText.bin', binary=True, limit=50000)
    elif name=="Temp":
        language = 'en'
        model = KeyedVectors.load_word2vec_format('./data/word_embeddings/glove.debiased.gender.race.bin', binary=True, limit=50000)
    #g,g1,g2 = None,None,None
    #deb_high = {}
    df = pd.read_csv("./data/mutliple_biases_norm.csv",header=0, keep_default_na=False)
    df = df.head(n=100)
    print(df.head(5))
    return "success"


@app.route('/get_csv/')
def get_csv():
    global df
    out = df.to_json(orient='records')
    return out

@app.route('/get_tar_csv/')
def get_tar_csv():
    global df_tar
    out = df_tar.to_json(orient='records')
    return out


@app.route('/get_tar_words/<selVal>')
def get_target_words(selVal):
    #selVal = request.args.get("selVal")
    path = './data/wordList/target/{0}/'.format(language) + selVal
    print("path:  ", path)
    words = []
    f = open(path, "r", encoding="utf8")
    for x in f:
        if len(x)>0:
            x = x.strip().lower()
            words.append(x)
    return jsonify(words)


# calculate bias direction when we have group of words not pairs
def groupBiasDirection(gp1, gp2):
    print(gp1,gp2)
    dim = len(model["he"])
    g1,g2 = np.zeros((dim,), dtype=float), np.zeros((dim,), dtype=float)
    for p in gp1:
        p = p.strip()
        if p not in model:
            continue
        p_vec = model[p]/norm(model[p])
        g1 = np.add(g1,p_vec)

    for q in gp2:
        q = q.strip()
        if q not in model:
            continue
        q_vec = model[q]/norm(model[q])
        g2 = np.add(g2,q_vec) 

    g1, g2 = g1/norm(g1), g2/norm(g2)
    return (g1,g2)


# calculate Group bias for 'Group' bias identification type (National Academy of Sciences)
@app.route('/groupBias/')
def groupBias():
    global df_tar
    temp = request.args.get("target")
    print("*******************")
    target = None
    target = json.loads(temp)
    print("Target ",target)
    print("Group direct bias function !!!!")

    bias_direc = []
    for p,q  in bias_words:
        bias_direc.append(groupBiasDirection(p,q)) 
    
    df_tar = None
    df_tar = df[0:0].copy()
    tar_bias = {}
    for t in target:
        if not t or len(t)<=1:
            continue
        if t not in model:
            continue
        else:
            b = []  # list for storing individual biases
            for (g1,g2) in bias_direc:
                b.append(round(cosine(g1,model[t])-cosine(g2,model[t]),5))
            tar_bias[t]= b
        print("ROW ",[t],tar_bias[t])
        df_tar.loc[len(df_tar)] = [t]+tar_bias[t]     # inserting row in df_tar
    return "success"


if __name__ == '__main__':
   app.run(port=6999, debug=True)