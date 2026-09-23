<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use SocialiteProviders\Manager\SocialiteWasCalled;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // Force HTTPS scheme when behind SSL reverse proxy / production server
        if (config('app.env') === 'production' || str_contains(request()->header('X-Forwarded-Proto', ''), 'https') || request()->secure()) {
            \Illuminate\Support\Facades\URL::forceScheme('https');
        }

        // Force asset root path if ASSET_URL is defined
        if ($assetUrl = config('app.asset_url')) {
            \Illuminate\Support\Facades\URL::forceAssetRoot($assetUrl);
        }

        // Register Keycloak Socialite Provider
        \Event::listen(SocialiteWasCalled::class, function (SocialiteWasCalled $event) {
            $event->extendSocialite('keycloak', \SocialiteProviders\Keycloak\Provider::class);
        });
    }
}
