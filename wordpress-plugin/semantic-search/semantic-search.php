<?php
/**
 * Plugin Name: Semantic Search
 */

add_action('wp_enqueue_scripts', function () {
    wp_enqueue_script(
        'semantic-search',
        plugin_dir_url(__FILE__) . 'sketch.js',
        [],
        '0.1',
        true   // load at bottom of page
    );
});