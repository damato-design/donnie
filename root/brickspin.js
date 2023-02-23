const blockColor = '#28fbbc';
const pegColor = '#243842';
const pegFace = '#28fbbc';

const illo = new Zdog.Illustration({
	// set canvas with selector
	element: "#zdog-illustration",
	zoom: 8,
	// resize: true,
	rotate: { 
		x: -Zdog.TAU/12,
		y: Zdog.TAU/8,
	}
});

const block = new Zdog.Group({ addTo: illo });

new Zdog.Box({
	addTo: block,
	width: 24,
	height: 8,
	depth: 12,
	stroke: 2,
	color: blockColor,
});

const pegs = new Zdog.Group({ addTo: illo });

function makePegs(sign) {
	return Array.from({ length: 4 }, (_, i) => {
		return {
			x: (i * 6) - 9,
			y: -6,
			z: sign * 3
		}
	}).map((translate) => {
		return new Zdog.Cylinder({
			addTo: pegs,
			rotate: { x: Zdog.TAU/4 },
			translate,
			diameter: 4,
			length: 1.25,
			stroke: false,
			color: pegColor,
			frontFace: pegFace
		})
	});
}

makePegs(-1);
makePegs(1);

let t0 = performance.now();
function animate() {
	illo.updateRenderGraph();
	const t1 = performance.now();
	illo.rotate.y += 0.001; 
	if (t1 - t0 > 200) return;
	requestAnimationFrame(animate);
	t0 = t1;
}
animate();

document.getElementById('zdog-illustration').addEventListener('click', () => (t0 = -Infinity));
