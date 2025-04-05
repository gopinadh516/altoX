import { rgbToHex, convertFigmaAlignment } from './utils';

figma.showUI(__html__, { width: 500, height: 600 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'ready') {
    await handleSelection();
  } else if (msg.type === 'cancel') {
    figma.closePlugin();
  }
};

figma.on("selectionchange", async () => {
  await handleSelection();
});

function processBackground(node: SceneNode & { fills?: readonly Paint[] | typeof figma.mixed }): string | undefined {
  if (!('fills' in node) || !node.fills || !Array.isArray(node.fills) || node.fills.length === 0) return undefined;
  
  const fill = node.fills[0];
  if (fill.type === 'SOLID') {
    return rgbToHex(fill.color);
  }
  return undefined;
}

function processBorder(node: SceneNode & { strokes?: readonly Paint[] }): any {
  if (!('strokes' in node) || !node.strokes || node.strokes.length === 0) return undefined;
  
  const stroke = node.strokes[0];
  if (stroke.type === 'SOLID') {
    return {
      width: (node as GeometryMixin).strokeWeight,
      color: rgbToHex(stroke.color),
      style: (node as GeometryMixin).strokeAlign.toLowerCase()
    };
  }
  return undefined;
}

function processNode(node: SceneNode): any {
  const obj: any = {
    id: node.id,
    name: node.name,
    type: node.type,
    style: {
      position: {
        x: Math.round(node.x),
        y: Math.round(node.y)
      },
      size: {
        width: Math.round(node.width),
        height: Math.round(node.height)
      }
    }
  };

  if ('opacity' in node) obj.style.opacity = node.opacity;
  if ('visible' in node) obj.style.visible = node.visible;

  if ('children' in node) {
    obj.children = node.children.map(child => processNode(child as SceneNode));
  }

  switch (node.type) {
    case 'TEXT':
      if ('characters' in node) {
        obj.content = node.characters;
        obj.style.text = {
          fontSize: `${String(node.fontSize)}px`,
          fontFamily: 'fontName' in node && typeof node.fontName !== 'symbol' ? node.fontName.family : 'inherit',
          fontWeight: 'fontName' in node && typeof node.fontName !== 'symbol' ? node.fontName.style : 'normal',
          textAlign: node.textAlignHorizontal.toLowerCase(),
          verticalAlign: node.textAlignVertical.toLowerCase(),
          lineHeight: node.lineHeight && typeof node.lineHeight === 'object' && 'value' in node.lineHeight
            ? `${node.lineHeight.value}${node.lineHeight.unit.toLowerCase()}`
            : 'normal',
          color: 'fills' in node && 
                 Array.isArray(node.fills) && 
                 node.fills.length > 0 && 
                 node.fills[0].type === 'SOLID'
            ? rgbToHex((node.fills[0] as SolidPaint).color)
            : '#000000'
        };
      }
      break;

    case 'RECTANGLE':
    case 'FRAME':
      obj.style.background = processBackground(node);
      obj.style.border = processBorder(node);
      obj.style.borderRadius = 'cornerRadius' in node ? `${String(node.cornerRadius)}px` : undefined;
      
      if ('layoutMode' in node) {
        obj.style.layout = {
          display: node.layoutMode === 'HORIZONTAL' ? 'flex' : 'grid',
          direction: node.layoutMode.toLowerCase(),
          gap: `${node.itemSpacing}px`,
          padding: {
            top: `${node.paddingTop}px`,
            right: `${node.paddingRight}px`,
            bottom: `${node.paddingBottom}px`,
            left: `${node.paddingLeft}px`
          },
          justifyContent: convertFigmaAlignment(node.primaryAxisAlignItems),
          alignItems: convertFigmaAlignment(node.counterAxisAlignItems)
        };
      }
      break;

    case 'GROUP':
    case 'COMPONENT':
    case 'INSTANCE':
      break;

    case 'VECTOR':
    case 'STAR':
    case 'LINE':
    case 'ELLIPSE':
    case 'POLYGON':
      if ('fills' in node) {
        obj.style.background = processBackground(node);
      }
      if ('strokes' in node) {
        obj.style.border = processBorder(node);
      }
      break;
  }

  return obj;
}

async function handleSelection() {
  const selection = figma.currentPage.selection;
  
  if (selection.length > 0) {
    const nodes = selection;
    console.log('Selected nodes:', nodes);

    const exportData = nodes.map(node => {
      const processedNode = processNode(node);
      console.log('Processed node:', processedNode);
      return {
        json: processedNode,
        imagePromise: node.exportAsync({
          format: 'PNG',
          constraint: { type: 'SCALE', value: 2 }
        })
      };
    });

    try {
      const results = await Promise.all(
        exportData.map(async data => ({
          json: data.json,
          image: await data.imagePromise
        }))
      );

      console.log('Exported results:', results);

      figma.ui.postMessage({
        type: 'export-data',
        data: results
      });
    } catch (error) {
      console.error("Error exporting nodes:", error);
      figma.notify("Error exporting selected nodes");
      figma.ui.postMessage({ 
        type: 'export-error', 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else {
    figma.ui.postMessage({ type: 'no-selection' });
  }
}