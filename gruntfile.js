module.exports = function (grunt) {
//   const banner = `/*
// <%= pkg.name %> <%= pkg.version %>- <%= pkg.description %>
// <%= pkg.repository.url %>
// Built on <%= grunt.template.today("yyyy-mm-dd") %>
// */
// `;

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    mocha_istanbul: {
      coverage: {
        src: 'test', // a folder works nicely
        options: {
          mask: '*.js',
        },
      },
    },
    simplemocha: {
      options: {
        globals: ['expect'],
        timeout: 3000,
        ignoreLeaks: false,
        ui: 'bdd',
        reporter: 'tap',
      },
      all: { src: ['test/*.js'] },
    },
  });

  grunt.loadNpmTasks('grunt-simple-mocha');

  grunt.loadNpmTasks('grunt-mocha-istanbul');

  grunt.registerTask('default', ['mocha_istanbul']);

  grunt.registerTask('test', ['simplemocha']);

  grunt.registerTask('cover', ['mocha_istanbul']);
};
