## Responsive, bloat free, bootstrap powered admin style dashboard!

BigData is an AngularJS implementation of the RDash admin dashboard. The dashboard uses a small number of modules to get you started, along with some handy directives and controllers to speed up development using the dashboard.

Check out the [live example](http://rdash.github.io/)!

## Usage
### Requirements
* [NodeJS](https://nodejs.org)
* [Yarn](https://yarnpkg.com/)
* [Gulp](https://gulpjs.com/)

### Installation
1. Clone the repository
2. Install the NodeJS and Bower dependencies: `yarn`.
3. Run the gulp default task: `gulp`. This will build any changes and start webserver.
4. Run the gulp dev task: `gulp dev`. This will start webserver (use only after you have `dist` directory).

Ensure your preferred web server points towards the `dist` directory.

### Development
Continue developing the dashboard further by editing the `src` directory. With the `gulp` command, any file changes made will automatically be compiled into the specific location within the `dist` directory.

#### Modules & Packages
By default, BigData includes [`ui.bootstrap`](http://angular-ui.github.io/bootstrap/), [`ui.router`](https://github.com/angular-ui/ui-router) and [`ngCookies`](https://docs.angularjs.org/api/ngCookies). 

If you'd like to include any additional modules/packages not included with KTMS, add them to your `package.json` file and then update the `src/index.html` file, to include them in the minified distribution output.

## Credits
* [Elliot Hesp](https://github.com/Ehesp)
* [Leonel Samayoa](https://github.com/lsamayoa)
* [Mathew Goldsborough](https://github.com/mgoldsborough)
* [Ricardo Pascua Jr](https://github.com/rdpascua)
