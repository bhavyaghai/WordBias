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

df, df_tar, model = None, None, None
gender_bias = [("he","him","boy"),("she","her","girl")]
eco_bias = [("rich","wealthy"),("poor","impoverished")]
race_bias = [("african","black"),("european","white")]
bias_words = [gender_bias, eco_bias, race_bias]

@app.route('/setModel/<name>')
def setModel(name="Word2Vec"):
    global model, df
    model =  word2vec.KeyedVectors.load_word2vec_format('./data/word_embedding/word2vec_50k.bin', binary=True)
    #df = pd.read_csv("./data/bias.csv",header=0, keep_default_na=False)
    df = pd.read_csv("./data/mutliple_biases_norm.csv",header=0, keep_default_na=False)
    print(len(df))
    df = df
    return "success"

@app.route('/')
def index():
    setModel()
    return render_template('index.html')

@app.route('/biasViz')
def biasViz():
    setModel()
    return render_template('biasViz.html')

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
@app.route('/groupDirectBias/')
def groupDirectBias():
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

@app.route('/get_tar_words/')
def get_default_target_words():
    w = df["word"].tolist()
    w = w[:100]
    return jsonify(w)

if __name__ == '__main__':
   app.run(port=6999, debug=True)