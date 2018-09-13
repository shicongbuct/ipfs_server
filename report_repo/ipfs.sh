#!/bin/ash
data=`df|grep -w /data|awk '{print int($4)}'`

if test $data -gt 102400
then
	init=`ipfs init 2>&1`
	if [[ "${init:0:30}" == "Error: ipfs daemon is running." ]];then
		echo "ipfs daemoning is running."
	elif [[ "${init:38:46}" == "Error: ipfs configuration file already exists!" ]];then
		echo "ipfs repo already exists."
	elif [[ "${init:38:38}" == "generating 2048-bit RSA keypair...done" ]];then
		echo "ipfs init success"
		ipfs bootstrap add /ip4/39.106.106.129/tcp/4001/ipfs/QmRALx9X4aDqj4oqTvxRegeXwej1KWcb7kxSVsUCQA6ykq
		ipfs daemon &
	fi

else
	echo 'not detect disk'
fi
