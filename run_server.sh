#!/bin/bash
# To be executed on the remote server to deploy online
sudo -i
cd /home/stuffs1/bghai/WordBias/
export PATH=$PATH:/root/anaconda3/bin/
echo "Running Server ...";
source activate semantic

screen python app.py
screen -d
