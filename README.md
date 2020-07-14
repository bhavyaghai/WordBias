# WordBias: An Interactive Visual tool for exploring Intersectional Social biases encoded in Word Embeddings

[Live DEMO](http://130.245.128.219:6999/)

[Documentation](https://docs.google.com/document/d/1uw5OCxsddj8QeOqrZqgJJVBUV7rdTE9AEX9ymNzDQO0/edit?usp=sharing)

![teaser figure](teaser.PNG)


## Intended Use
Our tool is designed to be used by experts and non-experts alike. It can be used by researchers and data scientists to audit a pre-trained word embedding model for different kinds of biases and intersectional biases before deploying it for any downstream application. Compared to purely algorithmic means, our tool can provide a quick fix to test a variety of hypothesis (biases). Our tool can also be used as a learning/educational tool by students and non-experts to understand how AI (word embedding model) might be plaqued with multiple kinds of biases. Here, we are dealing with an an interdisciplinary problem with relevance to domains like linguists, sociology, digital humanties, etc. Our tool will enhance accessibility for such domain experts who mightn't be all programmers. It will act as a catalyst for broader community engagement and research.


## Installation Instructions
- Clone this repo
- Install Dependencies
-- flask
-- gensim
-- numpy
-- pandas
-- sklearn
-- scipy
-- py_thesaurus
- Run python app.py
- Browse localhost:6999

## Word Lists
- [Word embeddings quantify 100 years of gender and ethnic stereotypes (Supplementary Material)](https://www.pnas.org/content/pnas/suppl/2018/03/30/1720347115.DCSupplemental/pnas.1720347115.sapp.pdf)
- [The Geometry of Culture: Analyzing the Meanings of Class through Word Embeddings](https://journals.sagepub.com/doi/pdf/10.1177/0003122419877135)

## Word Embedding
-- Word2Vec embedding [Source link](https://code.google.com/archive/p/word2vec/)
-- Glove Embedding [Source link](https://nlp.stanford.edu/projects/glove/)
Glove embedding downloaded from this source can't be directly read by gensim. So, we will reformat it first. (see 'preprocessing word embedding' notebook)