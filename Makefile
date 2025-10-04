.PHONY: build run

build:
	podman build -t bitburner-typescript .

run:
	touch NetscriptDefinitions.d.ts && podman run --rm -it -v $$(pwd)/src:/app/src -v $$(pwd)/NetscriptDefinitions.d.ts:/app/NetscriptDefinitions.d.ts -p 12525:12525 --name bitburner-filesync bitburner-typescript
