<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    // Keycloak SSO (NPC-SSO Realm)
    'keycloak' => [
        'client_id'     => env('KEYCLOAK_CLIENT_ID', 'npc_smartflow'),
        'client_secret' => env('KEYCLOAK_CLIENT_SECRET'),
        'redirect'      => env('KEYCLOAK_REDIRECT_URI'),
        'base_url'      => env('KEYCLOAK_BASE_URL', 'https://service.npc.ac.th'),
        'realms'        => env('KEYCLOAK_REALM', 'NPC-SSO'),
    ],

    // npcjob Internal API (ดึงข้อมูลตำแหน่ง/ฝ่ายของบุคลากร)
    'npcjob' => [
        'api_url'   => env('NPCJOB_API_URL', 'https://service.npc.ac.th/npcjob/api_profile.php'),
        'api_token' => env('NPCJOB_API_TOKEN', 'npc_sf_2026_api_key_x9k2m'),
    ],

];
