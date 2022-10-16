const blockColor = '#2979f2';
const pegColor = '#2f81fc';
const pegFace = '#2979f2';

const illo = new Zdog.Illustration({
	// set canvas with selector
	element: "#zdog-illustration",
	zoom: 16,
	resize: true,
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

const peg = new Zdog.Cylinder({
	addTo: block,
	rotate: { x: Zdog.TAU/4 },
	translate: { x: -9, y: -5, z: 3 },
	diameter: 4,
	length: 2,
	stroke: false,
	color: pegColor,
	frontFace: pegFace
});

peg.copy({
	translate: { x: -9, y: -5, z: -3 },
});

peg.copy({
	translate: { x: -3, y: -5, z: -3 },
});

peg.copy({
	translate: { x: 3, y: -5, z: -3 },
});

peg.copy({
	translate: { x: 9, y: -5, z: -3 },
});

peg.copy({
	translate: { x: 9, y: -5, z: 3 },
});

peg.copy({
	translate: { x: 3, y: -5, z: 3 },
});

peg.copy({
	translate: { x: -3, y: -5, z: 3 },
});


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

