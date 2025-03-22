
figma.showUI(__html__, { 
  width: 800, 
  height: 800, 
  themeColors: true 
});

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

async function handleSelection() {
  const selection = figma.currentPage.selection;
  
  if (selection.length > 0) {
      const nodes = selection;
      const exportData = nodes.map(node => {
          return ({
              json: processNode(node),
              imagePromise: node.exportAsync({
                  format: 'PNG',
                  constraint: { type: 'SCALE', value: 2 }
              })
          });
      });

      try {
          const results = await Promise.all(
              exportData.map(async data => ({
                  json: data.json,
                  image: await data.imagePromise
              }))
          );

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

  // Add opacity and visibility
  if ('opacity' in node) obj.style.opacity = node.opacity;
  if ('visible' in node) obj.style.visible = node.visible;

  switch (node.type) {
      case 'TEXT':
          if ('characters' in node) {
              obj.content = node.characters;
              obj.style.text = {
                  fontSize: `${String(node.fontSize)}px`,
                  fontFamily: typeof node.fontName === 'object' ? node.fontName.family : 'inherit',
                  fontWeight: typeof node.fontName === 'object' ? node.fontName.style : 'normal',
                  textAlign: node.textAlignHorizontal.toLowerCase(),
                  verticalAlign: node.textAlignVertical.toLowerCase(),
                  lineHeight: typeof node.lineHeight === 'object' && node.lineHeight && 'value' in node.lineHeight
                      ? `${node.lineHeight.value}${node.lineHeight.unit.toLowerCase()}`
                      : 'normal',
                  color: Array.isArray(node.fills) && node.fills[0] && node.fills[0].type === 'SOLID' 
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
                  display: node.layoutMode.toLowerCase() === 'HORIZONTAL' ? 'flex' : 'grid',
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
          if ('children' in node) {
              obj.children = node.children.map(child => 
                  processNode(child as SceneNode)
              );
          }
          break;
  }

  return obj;
}

function processBackground(node: SceneNode & MinimalFillsMixin): any {
  if (!('fills' in node) || !node.fills) return {};

  const fill = Array.isArray(node.fills) ? node.fills[0] : undefined;
  if (!fill || !fill.visible) return {};

  switch (fill.type) {
      case 'SOLID':
          return {
              color: rgbToHex(fill.color),
              opacity: fill.opacity
          };
      case 'GRADIENT_LINEAR':
          return {
              gradient: {
                  type: 'linear',
                  angle: calculateGradientAngle(fill.gradientTransform),
                  stops: fill.gradientStops.map((stop: ColorStop) => ({
                      color: rgbToHex(stop.color),
                      position: `${Math.round(stop.position * 100)}%`
                  }))
              }
          };
      default:
          return {};
  }
}

function processBorder(node: SceneNode & MinimalStrokesMixin): any {
  if (!('strokes' in node) || !node.strokes.length) return {};

  const stroke = node.strokes[0];
  return {
      width: `${String(node.strokeWeight)}px`,
      style: 'solid',
      color: stroke.type === 'SOLID' ? rgbToHex(stroke.color) : '#000000',
      opacity: stroke.opacity
  };
}

function rgbToHex({ r, g, b }: RGB): string {
  const toHex = (value: number) => {
      const hex = Math.round(value * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function convertFigmaAlignment(alignment: string): string {
  const alignmentMap: { [key: string]: string } = {
      'MIN': 'flex-start',
      'MAX': 'flex-end',
      'CENTER': 'center',
      'SPACE_BETWEEN': 'space-between'
  };
  return alignmentMap[alignment] || 'flex-start';
}

function calculateGradientAngle(transform: Transform): number {
  return Math.round(Math.atan2(transform[0][1], transform[0][0]) * (180 / Math.PI));
}

