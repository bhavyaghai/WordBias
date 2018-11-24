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


app = Flask(__name__, static_url_path='', static_folder='', template_folder='')


@app.route('/')
def index():
    return render_template('index.html')


if __name__ == '__main__':
   app.run(port=6999, debug=True)