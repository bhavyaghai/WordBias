#!/bin/bash
# To be executed on the remote server to deploy online
export PATH=$PATH:/root/anaconda3/bin/
echo "Running Server ...";
source activate semantic

screen python app.py
screen -d
