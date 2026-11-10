<?php
/**
 * Plugin Name: Semantic Search
 */

// Load the JS and tell it this site's home URL
add_action('wp_head', function () {
    $file = plugin_dir_path(__FILE__) . 'semantic-search.js';
    $src  = plugin_dir_url(__FILE__) . 'semantic-search.js?ver=' . filemtime($file);
    echo '<script>window.semanticSearch = ' . wp_json_encode(['home' => home_url('/')]) . ';</script>';
    echo '<script type="module" src="' . esc_url($src) . '"></script>';
});

function semantic_ids() {
    if (empty($_GET['semantic'])) return null;
    return array_values(array_filter(array_map('intval', explode(',', $_GET['semantic']))));
}

// Show exactly the posts whose project_id the JS found, in that order
add_action('pre_get_posts', function ($q) {
    if (is_admin() || !$q->is_main_query() || !$q->is_search()) return;
    $project_ids = semantic_ids();
    if ($project_ids === null) return;

    global $wpdb;
    $post_ids = [];
    if ($project_ids) {
        $ph   = implode(',', array_fill(0, count($project_ids), '%d'));
        $rows = $wpdb->get_results($wpdb->prepare(
            "SELECT post_id, meta_value FROM {$wpdb->postmeta} WHERE meta_key = 'project_id' AND meta_value IN ($ph)",
            $project_ids
        ));
        $map = [];
        foreach ($rows as $r) $map[(int) $r->meta_value] = (int) $r->post_id;
        foreach ($project_ids as $pid) if (isset($map[$pid])) $post_ids[] = $map[$pid];
    }

    $q->set('post__in', $post_ids ?: [0]);   // [0] = show "no results"
    $q->set('orderby', 'post__in');          // keep semantic ranking
    $q->set('posts_per_page', count($post_ids) ?: 1);
}, 99);

// Turn off WordPress / WP Extended Search keyword matching for these searches
add_filter('posts_search', function ($search, $q) {
    if ($q->is_main_query() && $q->is_search() && semantic_ids() !== null) return '';
    return $search;
}, 99, 2);

// add_action('wp_head', function () {
//     $file = plugin_dir_path(__FILE__) . 'semantic-search.js';
//     $src  = plugin_dir_url(__FILE__) . 'semantic-search.js?ver=' . filemtime($file);
//     echo '<script type="module" src="' . esc_url($src) . '"></script>';
// });

// add_action('wp_enqueue_scripts', function () {
//     wp_enqueue_script(
//         'semantic-search',
//         plugin_dir_url(__FILE__) . 'semantic-search.js',
//         [],
//         '0.1',
//         false   // load at bottom of page
//     );
// });