using UnityEngine;
namespace LightMaze.Production
{
    public sealed class ProductionBoltVisual : MonoBehaviour
    {
        void Start()
        {
            var parent=transform.parent;
            if (!parent) return;
            Vector3 s=parent.lossyScale;
            transform.localScale=new Vector3(1f/Mathf.Max(.001f,s.x),1f/Mathf.Max(.001f,s.y),1f/Mathf.Max(.001f,s.z));
        }
    }
}
