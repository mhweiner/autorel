#!/usr/bin/env node

require('../dist/index')
    .main()
    .catch(console.log.bind(console));
