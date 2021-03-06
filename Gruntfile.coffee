# global module: false
module.exports = (grunt) ->
  grunt.initConfig
    pkg: grunt.file.readJSON 'package.json'
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.organization %>/<%= pkg.author.name %>;' +
      ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n'
    
    coffeelint:
      options:
        force: false
        max_line_length:
          level: 'ignore'
      dist:
        src: '<%= coffee.dist.src %>'
      dev:
        src: '<%= coffee.dev.src %>'
        options:
          force: true

    coffee:
      options:
        sourceMap: true
      dev:
        src: 'coffee/*.coffee'
        expand: true
        flatten: true
        dest: 'js/'
        ext: '.js'
        extDot: 'last'
      dist:
        src: 'coffee/*.coffee'
        expand: true
        flatten: true
        dest: 'js/'
        ext: '.dist.js'
        extDot: 'last'

    concat:
      dev:
        src: [
          'bower_components/d3/d3.js',
          'bower_components/jquery/dist/jquery.js',
          'bower_components/lodash/dist/lodash.js',
          'bower_components/fastclick/lib/fastclick.js',
          'js/lib/*.js',
        ]
        dest: 'js/vendor.js'
      dist:
        src: [
          'bower_components/d3/d3.js',
          'bower_components/jquery/dist/jquery.js',
          'bower_components/lodash/dist/lodash.js',
          'bower_components/fastclick/lib/fastclick.js',
          'js/lib/*.js',
          '<%= coffee.dist.dest %>*.dist.js'
        ]
        dest: 'js/dist.js'

    sass:
      dev:
        options:
          sourcemap: 'auto'
          style: 'nested'
        src: '<%= sass.dist.src %>'
        dest: '<%= sass.dist.dest %>'
      dist:
        options:
          sourcemap: 'none'
          style: 'compressed'
        src: 'scss/screen.scss'
        dest: 'css/screen.css'

    autoprefixer:
      dev:
        options:
          browsers: ['last 2 Chrome versions', 'last 2 Safari versions', 'last 2 Firefox versions']
          map: true
        src: '<%= autoprefixer.dist.src %>'
        dest: '<%= autoprefixer.dist.dest %>'
      dist:
        options:
          browsers: ['> 1%', 'IE >= 9']
        src: 'css/screen.css'
        dest: 'css/screen.css'

    uglify:
      options:
        banner: '<%= banner %>'
        preserveComments: 'some'
        screw_ie8: true # absolutely!
        mangle:
          except: ['jQuery', '_', 'd3', 'Modernizr', 'FastClick']
      dist:
        src: '<%= concat.dist.dest %>'
        dest: 'js/dist.min.js'

    watch:
      options:
        livereload: true
      coffee:
        files: '<%= coffee.dev.src %>'
        tasks: ['coffeelint:dev', 'coffee:dev']
        options: livereload: false
      sass:
        files: 'scss/*.scss'
        tasks: ['sass:dev', 'autoprefixer:dev']
        options: livereload: false
      css:
        files: 'css/*.css'
        tasks: [] # trigger livereload
      js:
        files: 'js/*.js'
        tasks: [] # trigger livereload
      html:
        files: '*.html'
        tasks: [] # trigger livereload

    connect:
      server:
        options:
          port: 5757
          hostname: '0.0.0.0'
          livereload: true

  grunt.loadNpmTasks 'grunt-coffeelint'
  grunt.loadNpmTasks 'grunt-contrib-coffee'
  grunt.loadNpmTasks 'grunt-contrib-concat'
  grunt.loadNpmTasks 'grunt-contrib-uglify'
  grunt.loadNpmTasks 'grunt-contrib-sass'
  grunt.loadNpmTasks 'grunt-autoprefixer'
  grunt.loadNpmTasks 'grunt-contrib-watch'
  grunt.loadNpmTasks 'grunt-contrib-connect'

  # Note to self: Output files to separate dev/ and dist/ directories next time.

  grunt.registerTask 'dist', ['coffeelint:dist', 'coffee', 'concat:dist', 'uglify', 'sass:dist', 'autoprefixer:dist']
  grunt.registerTask 'default', ['coffeelint:dev', 'coffee', 'concat:dev', 'sass:dev', 'autoprefixer:dev']
  grunt.registerTask 'server', ['connect', 'watch']
