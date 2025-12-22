module.exports = {
  plugins: [
    // Petit plugin inline pour remplacer `color-adjust` par `print-color-adjust`
    function replaceColorAdjust() {
      return {
        postcssPlugin: 'replace-color-adjust',
        Once(root) {
          root.walkDecls(decl => {
            if (decl.prop && decl.prop.toLowerCase() === 'color-adjust') {
              // ajoute la propriété moderne puis supprime l'ancienne
              decl.cloneBefore({ prop: 'print-color-adjust', value: decl.value });
              decl.remove();
            }
          });
        }
      };
    }
  ]
};
module.exports.postcss = true;

