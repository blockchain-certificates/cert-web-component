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

# Using \<validate-certificate\>


A demo of the certificate verifier is available here:

[http://localhost:8080/demo/verifier-demo.html](http://localhost:8080/demo/verifier-demo.html)

The `verifier-demo` sample displays and verifies a local Blockchain Certificate (`href="./sample_signed_cert-valid-1.2.0.json"`).

```
<validate-certificate href="./sample_signed_cert-valid-1.2.0.json">
  <blockchain-certificate href="./sample_signed_cert-valid-1.2.0.json"></blockchain-certificate>
</validate-certificate>
```

The `validate` button starts the verification process, and the results are displayed in the web page. 

Note that the URL argument may be a URL hosting a Blockcert. This is useful for Blockcerts that are hosted by an issuer, in S3, etc.


# Display Guidelines

## General Principles
A Blockchain Certificate represents a remarkable achievement on behalf of the recipient. In order to honor that accomplishment, it's important that the display of the certificate be consistent across the various platforms and environments that it might be displayed in.

## Standard Open-Source Displays
The fastest way to display a certificate in your application is to use one of the existing displays provided by the open source community. This will ensure a consistent experience for your users across any Blockchain Certificate application with minimal effort on your part.

Here's a list of supported displays:

* The `<blockchain-certificate>` web component for rendering a certificate.
* The `<validate-certificate>` web component for in-browser validation of a certificate.
* The [RenderedCertificateView](https://github.com/blockchain-certificates/cert-wallet/tree/master/RenderedCertificateView) for iOS applications.

## The `<blockchain-certificate>` web component

The easiest way to install the [standard web components](https://github.com/blockchain-certificates/cert-web-component) is to use bower. In your project, simply run:

```
bower install blockchain-certificate --save
```

Alternatively, you can clone [the blockchain-certificate](https://github.com/blockchain-certificates/cert-web-component) repo and host it independently of your project by running `polymer serve` in a server environment, like [heroku](https://heroku.com). Note that this approach works best when you can run it on a subdomain, otherwise you'll have to set up Cross-Origin Resource Sharing in order for it to work correctly.

Once you've got the web components as part of your project, there's just a few simple steps to using them. These are also present in the project's [README file](https://github.com/blockchain-certificates/cert-web-component#using-blockchain-certificate).

1. (Optional) Include the web components polyfill to add support for older browsers.
2. Import the `blockchain-certificate.html` web component
3. Use the &lt;blockchain-certificate&gt; element and specify the href path to your certificate.

Let's look at an example.

Step 1: Include the web components polyfill for older browsers. It's important that this be loaded before any other front-end framework you might be using, like Angular or Ember.js.

```
<script src="/components/webcomponentsjs/webcomponents-lite.min.js"></script>
```

Step 2: Import the `blockchain-certificate` web component.

```
<link rel="import" href="/components/blockchain-certificate/blockchain-certificate.html">
```

Step 3: Use the `<blockchain-certificate>` element in the body of your page.

```
<blockchain-certificate href="/path/to/certificate.json">
</blockchain-certificate>
```

<!---
Once properly installed, you should see something like this:

<blockchain-certificate href="/assets/js/mit_certificate.json"></blockchain-certificate>
-->

## The `<validate-certificate>` web component

The `<validate-certificate>` web component allows for in-browser validation of any hosted certificates. Using this component is easy. After installing or hosting the [blockchain-certificate repo](https://github.com/blockchain-certificates/cert-web-component), import the `validate-certificate` web component:

```
<link rel="import" href="/components/blockchain-certificate/validate-certificate.html">
```

Finally, wrap any `<blockchain-certificate>` elements in a `<validate-certificate>` tag.

```
<validate-certificate>
  <blockchain-certificate href="/path/to/certificate.json">
  </blockchain-certificate>
</validate-certificate>
```

Once that's done, you'll see the same rendered certificate with an associated Validate button. This will perform all of the necessary steps to validate the certificate in the browser.

<!---
This certificate validates at transaction ID `48f64ff1517554dac3496e9da0a28ca0ae492682b0898e38a4e17e7f90ee1295`:

<validate-certificate>
  <blockchain-certificate href="/assets/js/mit_certificate.json">
  </blockchain-certificate>
</validate-certificate>
-->
**Caution:** The validate-certificate component is only intended to be used in low-risk validation scenarios. It is strongly encouraged that anyone without an established, trusted relationship to the certificate's recipient use an independent verifier installed from a trusted source in order to properly validate the certificate. This prevents someone from writing a fake validator that simply looks like this component, but doesn't do proper validation.


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

## Contact

Contact us at [the Blockcerts community forum](http://community.blockcerts.org/).
