#version 120

uniform sampler2D colortex0;
varying vec2 texcoord;

// Mythical Shaders: Verdant color grade.
// These options appear in Iris/OptiFine shader settings.
#define MYTHICAL_VIBRANCE // Slightly enrich natural Minecraft colors
#define MYTHICAL_WARMTH // Add a restrained golden warmth
#define MYTHICAL_VIGNETTE // Subtle cinematic edge shading

void main() {
    vec4 source = texture2D(colortex0, texcoord);
    vec3 color = source.rgb;

    // Gentle contrast curve that keeps the look close to vanilla.
    color = (color - vec3(0.5)) * 1.055 + vec3(0.5);

    #ifdef MYTHICAL_VIBRANCE
        float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
        color = mix(vec3(luminance), color, 1.075);
    #endif

    #ifdef MYTHICAL_WARMTH
        color.r *= 1.018;
        color.g *= 1.004;
        color.b *= 0.982;
    #endif

    #ifdef MYTHICAL_VIGNETTE
        vec2 centered = texcoord * 2.0 - 1.0;
        float edge = dot(centered, centered);
        float shade = clamp(1.0 - edge * 0.035, 0.92, 1.0);
        color *= shade;
    #endif

    gl_FragData[0] = vec4(clamp(color, 0.0, 1.0), source.a);
}
