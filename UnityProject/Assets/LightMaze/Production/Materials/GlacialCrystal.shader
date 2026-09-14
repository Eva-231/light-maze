Shader "LightMaze/Production/Glacial Crystal"
{
    Properties { _BaseColor("Deep ice",Color)=(.035,.17,.29,1) [HDR] _EmissionColor("Fracture light",Color)=(.15,.8,1.5,1) _Smoothness("Polish",Range(0,1))=.8 }
    SubShader
    {
        Tags { "RenderPipeline"="UniversalPipeline" "RenderType"="Opaque" }
        Pass
        {
            Tags { "LightMode"="UniversalForward" }
            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl"
            struct A {float4 positionOS:POSITION;float3 normalOS:NORMAL;float2 uv:TEXCOORD0;};
            struct V {float4 positionCS:SV_POSITION;float3 world:TEXCOORD0;float3 normal:TEXCOORD1;float2 uv:TEXCOORD2;float fog:TEXCOORD3;};
            CBUFFER_START(UnityPerMaterial)
            float4 _BaseColor,_EmissionColor;float _Smoothness;
            CBUFFER_END
            V vert(A v){V o;o.world=TransformObjectToWorld(v.positionOS.xyz);o.positionCS=TransformWorldToHClip(o.world);o.normal=TransformObjectToWorldNormal(v.normalOS);o.uv=v.uv;o.fog=ComputeFogFactor(o.positionCS.z);return o;}
            half4 frag(V i):SV_Target
            {
                float3 n=normalize(i.normal),v=GetWorldSpaceNormalizeViewDir(i.world);
                Light light=GetMainLight();
                float rim=pow(1-saturate(abs(dot(n,v))),3);
                float spec=pow(saturate(dot(n,normalize(v+light.direction))),64)*2;
                float facet=abs(sin(i.world.y*7+i.world.x*4+i.world.z*3));
                float fracture=pow(saturate(1-facet),28)*.22;
                float3 c=_BaseColor.rgb*(.7+saturate(dot(n,light.direction))*.6);
                c+=_EmissionColor.rgb*(.24+rim*1.3+fracture)+spec*light.color*.65;
                return half4(MixFog(c,i.fog),1);
            }
            ENDHLSL
        }
        UsePass "Universal Render Pipeline/Lit/ShadowCaster"
        UsePass "Universal Render Pipeline/Lit/DepthOnly"
    }
}
