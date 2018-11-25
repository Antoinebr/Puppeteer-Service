# Puppeteer Service 

A service to get third party tags from a given website. 
More enpoints and features to come 


## How to start ? 

```bash BUILD.sh && bash RUN.sh```


## API 

### Get the third party for a given domain 

```bash
curl -X GET \
  'http://localhost:3001/get3p?url=https://www.randomeSite.com/' \
  -H 'Content-Type: application/json' 
```

Returns : 

shouldntBeBlocked is equal to eerything but marketing tags, so you find CDN... 

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

