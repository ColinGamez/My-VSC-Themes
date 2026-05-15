Swatch = Struct.new(:name, :hex_value, keyword_init: true) do
  def css_variable
    "--orange-#{name}: #{hex_value};"
  end
end

class Palette
  include Enumerable

  def initialize(swatches)
    @swatches = swatches
  end

  def each(&block)
    @swatches.each(&block)
  end
end

palette = Palette.new([
  Swatch.new(name: "ember", hex_value: "#ff7a18"),
  Swatch.new(name: "citrus", hex_value: "#ffbc42"),
  Swatch.new(name: "peach", hex_value: "#ffd9a8")
])

puts palette.map(&:css_variable)
