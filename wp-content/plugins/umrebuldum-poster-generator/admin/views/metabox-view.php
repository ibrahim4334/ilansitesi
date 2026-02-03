<?php
/**
 * Metabox View
 * 
 * @var WP_Post $post
 */

defined('ABSPATH') || exit;

$poster = $this->generator->get($post->ID);
$templates = \Umrebuldum\Poster\Templates::get_template_options();
$sizes = \Umrebuldum\Poster\Templates::get_size_options();
?>

<div class="upg-metabox">
    <?php if ($poster && file_exists($poster['path'])): ?>
        <img src="<?php echo esc_url($poster['url']); ?>" 
             alt="Afiş" 
             style="max-width:100%;margin-bottom:10px;border-radius:4px;">
        
        <p style="font-size:11px;color:#666;margin:0;">
            <?php echo esc_html($poster['template'] ?? 'default'); ?> / 
            <?php echo esc_html($poster['size'] ?? 'instagram'); ?><br>
            <?php echo date('d.m.Y H:i', $poster['generated']); ?>
        </p>
        
        <p style="margin-top:10px;">
            <a href="<?php echo esc_url($poster['url']); ?>" 
               target="_blank" class="button button-small">İndir</a>
            <button type="button" class="button button-small" 
                    onclick="upgRegenerate(<?php echo $post->ID; ?>)">
                Yeniden Üret
            </button>
        </p>
    <?php else: ?>
        <p style="color:#666;">Afiş henüz üretilmedi.</p>
        <button type="button" class="button button-primary" 
                onclick="upgRegenerate(<?php echo $post->ID; ?>)">
            🎨 Afiş Üret
        </button>
    <?php endif; ?>
    
    <hr style="margin:15px 0;">
    
    <p><strong>Özel Üretim:</strong></p>
    
    <select id="upg-template" style="width:100%;margin-bottom:5px;">
        <?php foreach ($templates as $key => $label): ?>
        <option value="<?php echo esc_attr($key); ?>"><?php echo esc_html($label); ?></option>
        <?php endforeach; ?>
    </select>
    
    <select id="upg-size" style="width:100%;margin-bottom:10px;">
        <?php foreach ($sizes as $key => $label): ?>
        <option value="<?php echo esc_attr($key); ?>"><?php echo esc_html($label); ?></option>
        <?php endforeach; ?>
    </select>
    
    <button type="button" class="button" style="width:100%;" 
            onclick="upgGenerate(<?php echo $post->ID; ?>)">
        Özel Afiş Üret
    </button>
</div>

<script>
function upgRegenerate(id) {
    upgGenerate(id, 
        '<?php echo esc_js(get_option('upg_default_template', 'default')); ?>',
        '<?php echo esc_js(get_option('upg_default_size', 'instagram')); ?>'
    );
}

function upgGenerate(id, template, size) {
    template = template || document.getElementById('upg-template').value;
    size = size || document.getElementById('upg-size').value;
    
    jQuery.post(ajaxurl, {
        action: 'upg_generate',
        listing_id: id,
        template: template,
        size: size,
        _wpnonce: '<?php echo wp_create_nonce('upg_generate'); ?>'
    }, function(response) {
        if (response.success) {
            location.reload();
        } else {
            alert('Hata: ' + response.data);
        }
    });
}
</script>
