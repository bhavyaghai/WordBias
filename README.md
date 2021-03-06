# WordBias: An Interactive Visual Tool for Discovering Intersectional Biases Encoded in Word Embeddings

- #### Read paper (including Supplementary material) [PDF](https://arxiv.org/abs/2103.03598)

- #### Video Presentation (5min) https://www.youtube.com/watch?v=LcwlyU3QT0w

- #### Live DEMO http://130.245.128.219:6999/

Paper accepted at ACM SIGCHI 2021 Late Breaking Work

![teaser figure](teaser.png)

The above picture shows the visual interface of WordBias. The image can be broken into 3 parts: <br />
(A) The Control Panel provides options to select words to be projected on the parallel coordinates plot <br />
(B) The Main View shows the bias scores of selected words (blue lines) along different bias types (axes) <br />
\(C\) The Search Panel enables users to search for a word and display the search/brushing results. <br />


In the above figure, the user has brushed over 'Male' and 'Islam' subgroups. Words with strong association to both these subgroups are listed below the search box like bomb, terror, aggression, etc. This suggests that Word2vec embedding contains biases against Muslim males. <br />

For a quick starter on Parallel Coordinates, please refer to this [link](https://towardsdatascience.com/parallel-coordinates-plots-6fcfa066dcb3).

## Video Teaser

https://user-images.githubusercontent.com/4745227/116230634-e0147e00-a725-11eb-8938-22b901f7b9c2.mp4


## Overview

WordBias is an interactive visual tool designed to explore biases against intersectional groups like black females, black muslim males, etc. encoded in word embeddings. Our tool considers a word to be associated with an intersectional group say ‘Christian Males’ if it associates strongly with each of its constituting subgroups (Christians and Males). Our tool aims to act as an effective <i>auditing</i> tool for experts, an <i>educational tool</i> for non-experts and enhance <i>accessibility</i> for domain experts.

## Installation Instructions

- Clone this repo

- Install Dependencies like flask, gensim, py_thesaurus, etc.

- Run python app.py

- Browse localhost:6999

## Citation

```
@inproceedings{ghai2021wordbias,
  title={WordBias: An Interactive Visual Tool for Discovering Intersectional Biases Encoded in Word Embeddings},
  author={Ghai, Bhavya and Hoque, Md Naimul and Mueller, Klaus},
  booktitle={Extended Abstracts of the 2021 CHI Conference on Human Factors in Computing Systems},
  pages={1--7},
  year={2021}
}
```

Feel free to email me for any questions, comments at bghai@cs.stonybrook.edu
