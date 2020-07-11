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
#from termcolor import colored
from scipy.spatial.distance import cosine
import json
#from datetime import datetime
import os
from flask import make_response
from functools import wraps, update_wrapper
from py_thesaurus import Thesaurus
import socket


app = Flask(__name__, template_folder='templates', static_folder='', static_url_path="/static")

language = "en"
df, model = None, None
#df_tar = None
#gender_bias = [("he","him","boy"),("she","her","girl")]
#eco_bias = [("rich","wealthy"),("poor","impoverished")]
#race_bias = [("african","black"),("european","white")]
#bias_words = {"gender":gender_bias, "religion":None, "race":race_bias,"sentiment":None}

'''
@app.route('/setModelBackup/<name>')
def setModelBackup(name="Word2Vec"):
    global model, df
    path = "./data/"
    model =  word2vec.KeyedVectors.load_word2vec_format(path+'word_embeddings/word2vec_50k.bin', binary=True)
    #df = pd.read_csv("./data/bias.csv",header=0, keep_default_na=False)
    #df = pd.read_csv(path+"all_biases_10k.csv",header=0, keep_default_na=False)
    df = pd.read_csv(path+"all_biases_50k.csv",header=0, keep_default_na=False)
    # print(len(df))
    df = df
    return "success"
'''

@app.route('/')
def index():
	#setModelBackup()
	set_model()
	return render_template('index.html')

@app.route('/set_model')
def set_model():
    global model, language
    name = request.args.get("embedding")
    if model is None:
        name = "Word2Vec"
        #name = "Glove (wiki 300d)" 
    print("Embedding name: ", name)
    if name=="Word2Vec":
        language = 'en'
        model =  word2vec.KeyedVectors.load_word2vec_format('./data/word_embeddings/word2vec_50k.bin', binary=True, limit=50041) 
    elif name=="Glove (wiki 300d)":
        # print("Glove word embedding backend")
        language = 'en'
        model = KeyedVectors.load_word2vec_format('./data/word_embeddings/glove_50k.bin', binary=True) #   
    elif name=="Word2Vec debiased":
        # print('./data/word_embeddings/GoogleNews-vectors-negative300-hard-debiased.bin')
        language = 'en'
        model = KeyedVectors.load_word2vec_format('./data/word_embeddings/GoogleNews-vectors-negative300-hard-debiased.bin', binary=True, limit=50000) 
    return "success"


@app.route('/get_csv/')
def get_csv():
    global df
    scaling = request.args.get("scaling")
    embedding = request.args.get("embedding")
    print("/get_csv/")
    print("Scaling: ", scaling)
    print("Embedding: ", embedding)
    
    if embedding=="Word2Vec":
        if scaling=="Normalization":
            df = pd.read_csv("./data/word2vec_50k.csv",header=0, keep_default_na=False)
        elif scaling=="Percentile":
            df = pd.read_csv("./data/word2vec_50k_percentile.csv",header=0, keep_default_na=False)
    elif embedding=="Glove (wiki 300d)":
        if scaling=="Normalization":
            df = pd.read_csv("./data/glove_50k.csv",header=0, keep_default_na=False)
        elif scaling=="Percentile":
            df = pd.read_csv("./data/glove_50k_percentile.csv",header=0, keep_default_na=False)
    out = df.to_json(orient='records')
    #print("out", out)
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
    #col_list = list(bias_words.keys())
    col_list = [c for c in df.columns if c!="word"]
    # histogram type - ALL, gender, race, eco
    
    filter_column = None
    if hist_type=="ALL":
        filter_column = df[col_list].abs().mean(axis=1)
    else:
        filter_column = df[hist_type]

    # print("Slider selection: ", slider_sel)
    # list of selected index based on selection
    ind = pd.Series([False]*df.shape[0])
    for slider in slider_sel:
        minV = slider[0]
        maxV = slider[1]
        if (minV != maxV):
            ind = ind | ((filter_column >= minV) & (filter_column <= maxV))

    # print("selected dataframe: ")
    col_list = ["word"] + col_list
    out = df.loc[ind, col_list].to_json(orient='records')
    return jsonify(out)

'''
@app.route('/get_tar_csv/')
def get_tar_csv():
    global df_tar
    out = df_tar.to_json(orient='records')
    return out
'''

@app.route('/get_histogram/<type_var>')
def get_histogram(type_var):
    global df
    bt = list(df.columns)[1:]
    val = []
    if type_var=="ALL":
        val = df[bt].abs().mean(axis=1)
    else:
        val = df[type_var.lower()]
    out = {"values":val.tolist(), "min":np.min(val), "max":np.max(val)}
    #print("************************************** Histogram ****************************")
    #print(df.columns)
    return jsonify(out)


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


# compute and return new type of bias
@app.route('/compute_new_bias')
def compute_new_bias():
    global df
    gp1_words = request.args.get("gp1_words").split(",")
    gp2_words = request.args.get("gp2_words").split(",")
    axis_name = request.args.get("axis_name")
    scaling = request.args.get("scaling")
    print("Scaling type: ", scaling)
    #active_words = request.args.getlist("active_words", type=str)
    active_words = json.loads(request.args.get("active_words"))
    
    print("gp1 words: ", gp1_words)
    print("gp2 words: ", gp2_words)
    print("active words: ", active_words)
    g1, g2 = groupBiasDirection(gp1_words, gp2_words)

    bias_score = []
    for index, row in df.iterrows():
        w = row["word"]
        # assuming group bias "Quantification algo"
        bias_score.append(round(cosine(g1,model[w])-cosine(g2,model[w]),4))

    
    norm_bias_score = []

    if scaling=="Normalization":
        print("Normalization")
        bias_score = np.array(bias_score)
        for b in bias_score:
            if b<0:
                norm_bias_score.append(-1*b/bias_min)
            else:
                norm_bias_score.append(b/bias_max)
    elif scaling=="Percentile":
        print("Percentile")
        arr = pd.Series(bias_score, dtype='float')
        values = arr[arr>0].sort_values(ascending=False, inplace=False)
        res1 = percentile_rank(values, negative=False)

        values = arr[arr<=0].sort_values(ascending=True, inplace=False)
        res2 = percentile_rank(values, negative=True)
        res = pd.concat([res1,res2])
        res = res.reindex(arr.index)
        norm_bias_score = res.tolist()

    df[axis_name] = norm_bias_score
    active_data = df[df['word'].isin(active_words)][axis_name]

    return jsonify({"all_data": norm_bias_score, "active_data": active_data.tolist()})

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


# while calculating for negative values we want the range to be [-1, 0] instead of [0,1]
# so, we have used 'negative' parameter to flip the sign if negative values are fed 
# more modular percentile_rank function
def percentile_rank(values, negative=False):
    out = values.copy()
    N = len(values)
    last_ind = -1
    for i,items in enumerate(values.iteritems()):
        index, val = items[0], items[1]
        if last_ind!=-1 and val==values.get(last_ind): 
            out.at[index] = out.get(last_ind)
            #print("last_ind: ",last_ind,"  index: ",index, " p: ",out.get(last_ind))
        else:
            p = (N-i)/N
            out.at[index] = p
            #print("index: ",index, " p: ",p)
        if negative:
            out.at[index] = out.get(index)*-1
        last_ind = index
    print(out)
    return out


# get list of filenames for group,target, word similarity & word analogy benchmark datasets folder
@app.route('/getFileNames/')
def getFileNames():
    #gp_path, tar_path, word_sim, word_ana = None, None, None, None
    gp_path, tar_path = None, None
    if language=='hi':
        gp_path = './data/wordList/groups/hi/'
        tar_path = './data/wordList/target/hi/'
        #word_sim = './data/benchmark/word_similarity/hi/'
        #word_ana = './data/benchmark/word_analogy/hi/'
    elif language=='fr':
        gp_path = './data/wordList/groups/fr/'
        tar_path = './data/wordList/target/fr/'
        #word_sim = './data/benchmark/word_similarity/fr/'
        #word_ana = './data/benchmark/word_analogy/fr/'
    else:
        gp_path = './data/wordList/groups/en/'
        tar_path = './data/wordList/target/en/'
        #word_sim = './data/benchmark/word_similarity/en/'
        #word_ana = './data/benchmark/word_analogy/en/'
    target = os.listdir(tar_path)
    group = os.listdir(gp_path)
    #sim_files = os.listdir(word_sim)
    #ana_files = os.listdir(word_ana)
    #return jsonify([group,target,sim_files,ana_files])
    return jsonify([group,target])

# populate default set of target words
@app.route('/getWords/')
def getWords():
    path = request.args.get("path")
    words = []
    f = open(path, "r", encoding="utf8")
    for x in f:
        if len(x)>0:
            x = x.strip().lower()
            words.append(x)
    return jsonify({"target":words})


if __name__ == '__main__':
    hostname = socket.gethostname()
    # If we are running this script on the remote server
    if hostname=='ubuntuedge1':
        app.run(host= '0.0.0.0', port=6999, debug=True)
    else:
        app.run(port=6999, debug=True)