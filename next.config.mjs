/** @type {import('next').NextConfig} */
const nextConfig = {
    
    // crossOrigin: "anonymous",
    // async headers() {
    //     return [
    //         {
    //             // matching all API routes
    //             source: "/api/:path*",
    //             headers: [
    //                 { key: "Access-Control-Allow-Credentials", value: "true" },
    //                 { key: "Access-Control-Allow-Origin", value: "*" }, // replace this your actual origin
    //                 { key: "Access-Control-Allow-Methods", value: "GET" },
    //                 { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    //                 { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    //                 { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
    //             ]
                
    //         },
    //         {
    //             source: '/hls/:path*',
    //             headers: [
    //                 { key: 'Access-Control-Allow-Origin', value: '*' },
    //                 { key: 'Content-Type', value: 'application/vnd.apple.mpegurl' },
    //             ]
    //         }
    //     ]
    // },
    // webpack: (config) => {
    //     config.externals.push({
    //         '@ffmpeg-installer/ffmpeg': 'commonjs @ffmpeg-installer/ffmpeg',
    //     });
    //     return config;
    // },
    // webpack: (config, { isServer }) => {
    //     if (isServer) {
    //         config.externals.push({
    //             '@ffmpeg-installer/ffmpeg': '@ffmpeg-installer/ffmpeg',
    //         })
    //     }
    //     return config
    // }
}

export default nextConfig;
