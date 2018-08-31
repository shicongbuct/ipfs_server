FROM node:10.4.1
MAINTAINER shicongbuct@126.com
RUN mkdir -p /usr/src/app
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN npm install --registry=https://registry.npm.taobao.org

EXPOSE 3000
CMD npm start