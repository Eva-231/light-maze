Shader "LightMaze/Production/Sigil"
{
    Properties
    {
        [HDR] _Tint("Light", Color) = (.2,.7,1,1)
        _Opacity("Opacity", Range(0,1)) = 1
        _Mode("0 Sigil / 1 Sweep / 2 Mist / 3 Spark", Float) = 0
    }
    SubShader
    {
        Tags { "RenderPipeline"="UniversalPipeline" "Queue"="Transparent" "RenderType"="Transparent" }
        Pass
        {
            Blend SrcAlpha One
            ZWrite Off
            Cull Off
            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
            struct A { float4 positionOS:POSITION; float2 uv:TEXCOORD0; float4 color:COLOR; };
            struct V { float4 positionCS:SV_POSITION; float2 uv:TEXCOORD0; float4 color:COLOR; };
            CBUFFER_START(UnityPerMaterial)
            float4 _Tint; float _Opacity, _Mode;
            CBUFFER_END
            V vert(A v) { V o; o.positionCS=TransformObjectToHClip(v.positionOS.xyz); o.uv=v.uv; o.color=v.color; return o; }
            float ring(float r,float target,float width) { return 1-smoothstep(width,width+max(fwidth(r),.001),abs(r-target)); }
            half4 frag(V i):SV_Target
            {
                float2 p=i.uv*2-1; float r=length(p); float a=atan2(p.y,p.x);
                float mask=0;
                if (_Mode<.5)
                {
                    mask=ring(r,.92,.002)+ring(r,.87,.003)+ring(r,.64,.002)+ring(r,.61,.0015)+ring(r,.24,.002);
                    float glyph=abs(frac((a+3.141593)*7.63944)-.5);
                    float marks=(1-smoothstep(.025,.065,glyph))*step(.68,r)*step(r,.82);
                    float crossbar=(1-smoothstep(.07,.11,glyph))*ring(r,.76,.002);
                    float spokes=(1-smoothstep(.003,.008,abs(sin(a*6))))*step(.27,r)*step(r,.59);
                    float star=ring(r*(.84+.16*cos(a*6)),.45,.002);
                    mask=saturate(mask+marks+crossbar+spokes+star);
                }
                else if (_Mode<1.5) mask=pow(saturate(1-abs(r-.85)*8),3);
                else if (_Mode<2.5)
                {
                    float n=sin(p.x*13+sin(p.y*19+_Time.y)*2)*sin(p.y*17-p.x*8+_Time.y);
                    mask=pow(saturate(1-r),2)*(.3+.18*n);
                }
                else mask=pow(saturate(1-r),3);
                return half4(_Tint.rgb*i.color.rgb, saturate(mask*_Opacity*_Tint.a*i.color.a));
            }
            ENDHLSL
        }
    }
}
