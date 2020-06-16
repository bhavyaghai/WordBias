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
from py_thesaurus import Thesaurus


app = Flask(__name__, template_folder='templates', static_folder='', static_url_path="/static")

language = "en"
df, df_tar, model = None, None, None
gender_bias = [("he","him","boy"),("she","her","girl")]
eco_bias = [("rich","wealthy"),("poor","impoverished")]
race_bias = [("african","black"),("european","white")]
bias_words = {"gender":gender_bias, "eco":eco_bias, "race":race_bias}

@app.route('/setModelBackup/<name>')
def setModelBackup(name="Word2Vec"):
    global model, df
    path = "./data/"
    model =  word2vec.KeyedVectors.load_word2vec_format(path+'word_embeddings/word2vec_50k.bin', binary=True)
    #df = pd.read_csv("./data/bias.csv",header=0, keep_default_na=False)
    df = pd.read_csv(path+"all_biases_10k.csv",header=0, keep_default_na=False)
    # print(len(df))
    df = df
    return "success"


@app.route('/')
def index():
	setModelBackup()
	return render_template('index.html')


@app.route('/biasViz')
def biasViz():
	return render_template('old.html')


@app.route('/setModel')
def setModel():
    global model, df, language
    name = request.args.get("embedding")
    if model is None:
        name = "Word2Vec" 
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
    #df = pd.read_csv("./data/mutliple_biases_norm.csv",header=0, keep_default_na=False)
    df = pd.read_csv("./data/all_biases_10k.csv",header=0, keep_default_na=False)
    #df = df[["word", "race", "gender", "eco"]].head(n=100)
    return "success"


@app.route('/get_csv/')
def get_csv():
    global df
    df2 = df[["word", "race", "gender", "eco"]]
    out = df2.to_json(orient='records')
    return out

@app.route('/get_all_words')
def get_all_words():
    if not model:
        setModel()
    return jsonify(list(model.vocab.keys()))

@app.route('/fetch_data',methods=['POST'])
def fetch_data():
    json_data = request.get_json(force=True);       
    slider_sel = json_data['slider_sel']
    hist_type = json_data["hist_type"]
    col_list = list(bias_words.keys())
    # histogram type - ALL, gender, race, eco
    
    filter_column = None
    if hist_type=="ALL":
        filter_column = df[col_list].abs().mean(axis=1)
    else:
        filter_column = df[hist_type]

    # histogram selection -- list of 4 int
    # slider_sel = request.args.getlist("slider_sel")
    # slider_sel = [float(x) for x in slider_sel]
    print("Slider selection: ", slider_sel)
    # list of selected index based on selection
    ind = pd.Series([False]*df.shape[0])
    for slider in slider_sel:
        minV = slider[0]
        maxV = slider[1]
        if (minV != maxV):
            ind = ind | ((filter_column >= minV) & (filter_column <= maxV))
    # if slider_sel[0]!=slider_sel[1]:
    #     ind = (filter_column >= slider_sel[0]) & (filter_column <= slider_sel[1]) 

    # if slider_sel[2]!=slider_sel[3]:
    #     ind = ind | ((filter_column >= slider_sel[2]) & (filter_column <= slider_sel[3]))

    # print("selected dataframe: ")
    col_list = ["word"] + col_list
    # print(df.loc[ind, col_list].shape)
    # print(df.loc[ind, col_list])
    out = df.loc[ind, col_list].to_json(orient='records')
    return jsonify(out)

@app.route('/get_tar_csv/')
def get_tar_csv():
    global df_tar
    out = df_tar.to_json(orient='records')
    return out

@app.route('/get_histogram/<type_var>')
def get_histogram(type_var):
    global df
    bt = ["gender", "race", "eco"]
    val = []
    if type_var=="ALL":
        val = df[bt].abs().mean(axis=1)
    else:
        val = df[type_var.lower()]
    out = {"values":val.tolist(), "min":np.min(val), "max":np.max(val)}
    return jsonify(out)


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


# First search for the given word in thesaurus
# If not found finds word in word_embedding and its neighbors
# thereafter, x and y components for each neighbors is calculated & returned
@app.route('/search/<name>')
def search(name):
    num_results = 25
    if model is None:
        setModel()
    neigh = []
    try:
        w = Word(name)
        neigh = w.synonyms()
    except:
        print("Not Found in Thesaurus !!!")
    
    if neigh:
        neigh = [x for x in neigh if x in model]
    if not neigh or len(neigh)<num_results:
        embd_neigh = model.similar_by_word(name, topn=50)
        for x in embd_neigh:
            if neigh and len(neigh)>=num_results:
                break
            if x[0] not in neigh:
                neigh.append(x[0])  
    #print(neigh)
    return jsonify(neigh)


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