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

// IDs come from the "semantic" cookie set by the JS; only used if it was for this exact query
function semantic_ids() {
    if (empty($_COOKIE['semantic']) || !isset($_GET['s'])) return null;
    $data = json_decode(wp_unslash($_COOKIE['semantic']), true);
    if (!is_array($data) || !isset($data['q'], $data['ids'])) return null;
    if (trim($data['q']) !== trim(wp_unslash($_GET['s']))) return null;
    return array_values(array_filter(array_map('intval', (array) $data['ids'])));
}

// Map project_ids (from the embeddings) to WordPress post IDs, keeping ranking order
function semantic_post_ids($project_ids) {
    if (!$project_ids) return [];
    global $wpdb;
    $ph   = implode(',', array_fill(0, count($project_ids), '%d'));
    $rows = $wpdb->get_results($wpdb->prepare(
        "SELECT post_id, meta_value FROM {$wpdb->postmeta} WHERE meta_key = 'project_id' AND meta_value IN ($ph)",
        $project_ids
    ));
    $map = [];
    foreach ($rows as $r) $map[(int) $r->meta_value] = (int) $r->post_id;
    $post_ids = [];
    foreach ($project_ids as $pid) if (isset($map[$pid])) $post_ids[] = $map[$pid];
    return $post_ids;
}

// Any front-end search (WordPress's own OR the theme's custom WP_Query) with ?semantic=
function is_semantic_query($q) {
    return !is_admin() && $q->get('s') && semantic_ids() !== null;
}

// Show exactly the posts whose project_id the JS found, in that order
add_action('pre_get_posts', function ($q) {
    if (!is_semantic_query($q)) return;
    $post_ids = semantic_post_ids(semantic_ids());
    $q->set('post__in', $post_ids ?: [0]);   // [0] = show "no results"
    $q->set('orderby', 'post__in');          // keep semantic ranking
    $q->set('posts_per_page', count($post_ids) ?: 1);
}, 99);

// Turn off WordPress / WP Extended Search keyword matching for these searches
add_filter('posts_search', function ($search, $q) {
    if (is_semantic_query($q)) return '';
    return $search;
}, 1000, 2); // must run after WP Extended Search (priority 500)

// Visible marker: prefix titles on semantic search results
add_filter('the_posts', function ($posts, $q) {
    if (!is_semantic_query($q)) return $posts;
    foreach ($posts as $post) {
        if (strpos($post->post_title, '[Semantic] ') !== 0) $post->post_title = '[Semantic] ' . $post->post_title;
    }
    return $posts;
}, 99, 2);
