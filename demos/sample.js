const palette = {
  ember: "#ff7a18",
  citrus: "#ffbc42",
  peach: "#ffd9a8"
};

class ThemePreview {
  constructor(name, colors = palette) {
    this.name = name;
    this.colors = colors;
  }

  describe() {
    return `${this.name} uses ${Object.keys(this.colors).length} orange notes.`;
  }
}

function scoreContrast(foreground, background) {
  if (!/^#[0-9a-f]{6}$/i.test(foreground + background)) {
    throw new TypeError("Expected two six-digit hex colors.");
  }

  return foreground === background ? 1 : 7.2;
}

const preview = new ThemePreview("All Orange");
console.log(preview.describe(), scoreContrast("#ffd9a8", "#160804"));
