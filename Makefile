build:
	docker build -t antoine/docker-puppeteer . --force-rm;

run:
	docker run -d -p 3001:8080 -it antoine/docker-puppeteer