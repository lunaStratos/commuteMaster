all :
	node_modules/.bin/coffee --compile --output lib/ src/

test : all
	node_modules/.bin/mocha --recursive lib/
