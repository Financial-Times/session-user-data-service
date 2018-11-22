# Session user data service [![Build Status](https://travis-ci.org/Financial-Times/session-user-data-service.svg?branch=master)](https://travis-ci.org/Financial-Times/session-user-data-service)

Integration service for Livefyre comments.

## Prerequisite
In order to run the service locally, you will either need to connect to the TEST mongodb on heroku MLab, or set up the database locally.
If you have to make changes that affects the database as well, you should follow the below steps to set up the database locally.

### Install MongoDB (optional)
First install mongodb as described here: https://docs.mongodb.com/manual/installation/.

You should import the data from the TEST database.
MongoDB URI has the following structure:

```
mongodb://{user}:{password}@{primaryHost}:{port},{secondaryHost}:{port}/{databaseName}?replicaSet=rs-{replicaSetName}
```

In order to import the database, run the following commands:

```
mongodump -h {primaryHost}:{port} -d {databaseName} -u {user} -p {password} -o {fileLocation}
```

```
mongorestore -h localhost:27017 -d session-user-data -u {localUsername} -p {localPassword} --file {localFile}
```
If you are in trouble, check out the official documentation https://docs.mongodb.com/manual/reference/program/mongorestore/.


## Install
You'll need to create environment variables.
The fastest way to do this is to copy the env variables from TEST by run the following (assuming your are logged in into heroku CLI):

```
heroku config -s  >> .env --app session-user-data-service-test
```

If you've installed the database locally, define the local database URL:

```
MONGOLAB_URI=mongodb://localhost:27017/session-user-data-service
```

Now run the initial npm install on the app

```
npm install
```

## Start the app
Run the following:

```
heroku local
```


## Useful links
API documentation: https://session-user-data.webservices.ft.com/apidoc/
Troubleshooting guide: https://session-user-data.webservices.ft.com/troubleshoot
