const fs = require('fs');
const p = 'C:/Users/USER/.gemini/antigravity/scratch/sistem-akademik-master/app/galeri/page.js';
let c = fs.readFileSync(p, 'utf8');

const replacement = `
export default function Galeri() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [items, setItems] = useState([]);

  useEffect(() => {
    async function loadData() {
      const res = await getSchoolProfilePublic();
      if (res.success && res.school) {
        if (res.school.galeriImages) {
          const arr = res.school.galeriImages.split(';').filter(Boolean);
          const newItems = arr.map((img, idx) => ({
            id: idx + 1,
            category: "all",
            image: img,
            title: "Galeri Foto " + (idx + 1),
            categoryName: "Dokumentasi",
          }));
          setItems(newItems);
        }
      }
    }
    loadData();
  }, []);
`;

c = c.replace(/export default function Galeri\(\) \{[\s\S]*?categoryName: "[^"]*",\n    \},\n  \]\);/, replacement);

fs.writeFileSync(p, c);
console.log('Galeri page logic updated to use dynamic DB images');
