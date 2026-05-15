from dataclasses import dataclass
from typing import Iterable


@dataclass(frozen=True)
class Swatch:
    name: str
    hex_value: str

    def css_variable(self) -> str:
        return f"--orange-{self.name}: {self.hex_value};"


def render_palette(swatches: Iterable[Swatch]) -> str:
    lines = [swatch.css_variable() for swatch in swatches]
    return "\n".join(lines)


palette = [
    Swatch("ember", "#ff7a18"),
    Swatch("citrus", "#ffbc42"),
    Swatch("peach", "#ffd9a8"),
]

print(render_palette(palette))
