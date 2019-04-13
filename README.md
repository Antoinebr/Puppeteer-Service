# Puppeteer Service

A service to get different informations from a given website thanks to Puppeteer

More endpoints and features to come

## How to start

```make build && make run```


## API

### Get the third party for a given domain

```bash

curl -X GET 'http://localhost:3001/get3p?url=https://www.renault.fr/' \
  -H 'Content-Type: application/json'

```

Returns :

```shouldntBeBlocked``` is equal to everything but marketing tags, so you find CDN...

```JSON
{
    "shouldBeBlocked": [
        "netmng.com",
        "googleadservices.com",
        "google-analytics.com",
        "googletagmanager.com",
        "facebook.net",
        "youtube.com"
    ],
    "shouldntBeBlocked": [
        "sc-static.net",
        "ytimg.com",
        "yimg.com",
        "googleapis.com",
    ]
}
```

### Get the code coverage of a given url

```bash
curl -X GET 'http://localhost:3001/coverage?url=https://www.renault.fr/' \
  -H 'Content-Type: application/json'
```

Retuns :

(The response example is truncated )

```JSON

{
    "summary": {
        "domcontentloaded": {
            "percentUsed": 17,
            "totalUsedBytes": "796KB",
            "totalBytes": "4,659.5KB"
        },
        "load": {
            "percentUsed": 39,
            "totalUsedBytes": "2,711.4KB",
            "totalBytes": "6,967.8KB"
        },
        "networkidle0": {
            "percentUsed": 39,
            "totalUsedBytes": "2,764.1KB",
            "totalBytes": "7,038KB"
        }
    },
    "urls": [
        {
            "cssUsed": 0,
            "jsUsed": 0,
            "usedBytes": 0,
            "totalBytes": 4186,
            "percentUsed": 0,
            "eventType": "domcontentloaded",
            "url": "https://libs.cdn.renault.com/etc/designs/renault_v2/18.13.1.RENAULT-7/common-assets/css/fonts/fonts-latin-basic.min.css",
            "summary": "0 bytes/4.1KB (0%)"
        },
        {
            "cssUsed": 0,
            "jsUsed": 12727,
            "usedBytes": 12727,
            "totalBytes": 41338,
            "percentUsed": 31,
            "eventType": "networkidle0",
            "url": "https://c.la1-c1-lon.salesforceliveagent.com/content/g/js/35.0/deployment.js?_=1543409239150",
            "summary": "12.4KB/40.4KB (31%)"
        }
    ]
}
```

### Get a mobile screenshot 

```bash

curl -X GET 'http://localhost:3001/screenshot?url=https://www.renault.fr/'

```

Returns : the image 



## Deploy this image ?

### You can use Google Cloud Run 


Deploy the image :

```
gcloud builds submit --tag gcr.io/<nameOfYourGCPProject>/puppeteer-service
```

Deploy the image :

```
gcloud beta run deploy --image gcr.io/<nameOfYourGCPProject>/puppeteer-service --memory=1Gi
```