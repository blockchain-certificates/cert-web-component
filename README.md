# \<blockchain-certificate\>

This is the easiest way to show a blockchain certificate. Follow the installation instructions below, then use the `blockchain-certificate` element pointed at the hosted certificate.

```
<blockchain-certificate href="./path/to/your/certificate.json">
</blockchain-certificate
```

With a valid certificate, you'll get something that follows our [community rendering guidelines](http://www.blockcerts.org/guide/display-guidelines.html) with minimal effort! It will look something like:

![prerendered demo](https://github.com/blockchain-certificates/cert-web-component/blob/master/demo/prerendered-demo.png)

# Using \<blockchain-certificate\>
You can use bower to install this web component.

```
bower install blockchain-certificate --save
```

At that point, you'll just need to do a few simple things to see the certificate render.

1. (Optional) Include a polyfill for web components, to add support for older browsers.
```
    <script src="https://cdnjs.cloudflare.com/ajax/libs/webcomponentsjs/0.7.22/webcomponents.min.js">
```
2. Import the web-component in the header of your html.
```
    <link rel="import" href="../blockchain-certificate.html">
```
3. Add the \<blockchain-certificate\> element and specify the href attribute to the certificate you need to render.
```
    <blockchain-certificate href="./path/to/your/certificate.json">
    </blockchain-certificate
```

For more detailed documentation on the attributes & a demo, use `polymer serve` below and go to [http://localhost:8080/components/blockchain-certificate/](http://localhost:8080/components/blockchain-certificate/) in order to see polymer's generated docs/demo web application.

# Development
## Install the Polymer-CLI

First, make sure you have the [Polymer CLI](https://www.npmjs.com/package/polymer-cli) installed. Then run `polymer serve` to serve your application locally.

## Viewing Your Application

```
$ polymer serve
```

## Building Your Application

```
$ polymer build
```

This will create a `build/` folder with `bundled/` and `unbundled/` sub-folders
containing a bundled (Vulcanized) and unbundled builds, both run through HTML,
CSS, and JS optimizers.

You can serve the built versions by giving `polymer serve` a folder to serve
from:

```
$ polymer serve build/bundled
```

## Running Tests

```
$ polymer test
```

Your application is already set up to be tested via [web-component-tester](https://github.com/Polymer/web-component-tester). Run `polymer test` to run your application's test suite locally.
