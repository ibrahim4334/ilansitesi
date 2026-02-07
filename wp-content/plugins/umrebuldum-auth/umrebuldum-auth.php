<?php
/**
 * Plugin Name: Umre Buldum Auth
 * Description: Handles authentication via Next.js Auth.js and synchronizes users with WordPress.
 * Version: 1.0.0
 * Author: Your Name
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class UmreBuldum_Auth {

    public function __construct() {
        add_action( 'rest_api_init', array( $this, 'register_routes' ) );
        add_action( 'init', array( $this, 'register_roles' ) );
        
        // Allow CORS
        add_action( 'init', function() {
            header("Access-Control-Allow-Origin: *");
            header("Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE");
            header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept");
        });
    }

    public function register_roles() {
        add_role( 'umreci', 'Umreci', array( 'read' => true ) );
        add_role( 'rehber', 'Rehber', array( 'read' => true, 'upload_files' => true ) );
        add_role( 'organizasyon', 'Organizasyon', array( 'read' => true, 'upload_files' => true, 'publish_posts' => true ) );
    }

    public function register_routes() {
        register_rest_route( 'umrebuldum/v1', '/auth', array(
            'methods'  => 'POST',
            'callback' => array( $this, 'handle_auth' ),
            'permission_callback' => '__return_true', // Public endpoint, secured by logic/secrets if needed (but implicit here)
        ) );
    }

    public function handle_auth( $request ) {
        $params = $request->get_json_params();
        $email = sanitize_email( $params['email'] );
        $name = isset($params['name']) ? sanitize_text_field( $params['name'] ) : '';
        $role = isset($params['role']) ? sanitize_text_field( $params['role'] ) : '';
        $provider = isset($params['provider']) ? sanitize_text_field( $params['provider'] ) : '';

        if ( ! is_email( $email ) ) {
            return new WP_Error( 'invalid_email', 'Invalid email address', array( 'status' => 400 ) );
        }

        $user = get_user_by( 'email', $email );
        $is_new_user = false;

        if ( ! $user ) {
            $username = $this->generate_username( $email, $name );
            $password = wp_generate_password();
            
            $user_id = wp_create_user( $username, $password, $email );
            
            if ( is_wp_error( $user_id ) ) {
                return $user_id;
            }

            $user = get_user_by( 'id', $user_id );
            $is_new_user = true;
            
            update_user_meta( $user_id, 'auth_provider', $provider );
            
            if ( ! empty( $name ) ) {
                $name_parts = explode( ' ', $name, 2 );
                wp_update_user( array(
                    'ID' => $user_id,
                    'first_name' => $name_parts[0],
                    'last_name' => isset( $name_parts[1] ) ? $name_parts[1] : '',
                    'display_name' => $name
                ) );
            }
        } else {
            // Update provider if not set?? Or list linked providers?
            // For now just ensure we have the user
        }

        // Handle Role Update
        $current_role = '';
        if ( ! empty( $role ) && in_array( $role, array( 'umreci', 'rehber', 'organizasyon' ) ) ) {
            $user->set_role( $role );
            $current_role = $role;
            update_user_meta( $user->ID, 'umre_role', $role ); // redundancy
        } else {
            // Get current role
            $roles = $user->roles;
            if ( ! empty( $roles ) ) {
                // Check if any of our custom roles exist
                foreach( $roles as $r ) {
                    if ( in_array( $r, array( 'umreci', 'rehber', 'organizasyon' ) ) ) {
                        $current_role = $r;
                        break;
                    }
                }
            }
        }

        $response_data = array(
            'success' => true,
            'user_id' => $user->ID,
            'role' => $current_role,
            'is_new' => $is_new_user,
        );

        if ( empty( $current_role ) ) {
            $response_data['code'] = 'requires_onboarding';
        } else {
             $response_data['code'] = 'login_success';
        }

        return rest_ensure_response( $response_data );
    }

    private function generate_username( $email, $name ) {
        $username = sanitize_user( $name, true );
        if ( empty( $username ) ) {
            $username = sanitize_user( substr( $email, 0, strpos( $email, '@' ) ), true );
        }
        
        // Ensure unique
        $original_username = $username;
        $i = 1;
        while ( username_exists( $username ) ) {
            $username = $original_username . $i;
            $i++;
        }
        
        return $username;
    }
}

new UmreBuldum_Auth();
