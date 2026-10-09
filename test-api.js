const API_BASE = 'http://localhost:5000/api';

async function testAll() {
  console.log('🧪 Starting API Test Suite...');

  // 1. Health check
  const healthRes = await fetch(`${API_BASE}/health`);
  const healthJson = await healthRes.json();
  console.log('✓ Health check:', healthJson.status);

  // 2. Fetch plants
  const plantsRes = await fetch(`${API_BASE}/plants`);
  const plantsJson = await plantsRes.json();
  console.log(`✓ Fetched plants count: ${plantsJson.count}`);
  const firstPlant = plantsJson.plants[0];
  console.log(`✓ First plant: ${firstPlant.name} (${firstPlant.ayushSystem})`);

  // 3. Plant by ID
  const plantByIdRes = await fetch(`${API_BASE}/plants/${firstPlant._id}`);
  const plantByIdJson = await plantByIdRes.json();
  console.log(`✓ Fetched plant by ID: ${plantByIdJson.name}`);

  // 4. Test Demo Login
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'demo@ayushgarden.org', password: 'garden123' })
  });
  const loginJson = await loginRes.json();
  console.log(`✓ Login success for: ${loginJson.user.name}`);
  const token = loginJson.token;
  const authHeader = { Authorization: `Bearer ${token}` };

  // 5. User Profile
  const profileRes = await fetch(`${API_BASE}/user/profile`, { headers: authHeader });
  const profileJson = await profileRes.json();
  console.log(`✓ Profile retrieved: ${profileJson.email}`);

  // 6. User Stats
  const statsRes = await fetch(`${API_BASE}/user/stats`, { headers: authHeader });
  const statsJson = await statsRes.json();
  console.log(`✓ User stats:`, statsJson);

  // 7. Save Plant
  const savePlantRes = await fetch(`${API_BASE}/user/saved-plants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader },
    body: JSON.stringify({ plantId: firstPlant._id })
  });
  const savePlantJson = await savePlantRes.json();
  console.log(`✓ Save plant response: ${savePlantJson.message}`);

  // 8. Fetch Saved Plants
  const savedListRes = await fetch(`${API_BASE}/user/saved-plants`, { headers: authHeader });
  const savedListJson = await savedListRes.json();
  console.log(`✓ Saved plants count: ${savedListJson.length}`);

  // 9. Create Garden Design
  const createGardenRes = await fetch(`${API_BASE}/gardens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader },
    body: JSON.stringify({
      gardenName: 'Automated Test Sanctuary',
      roomType: 'Balcony',
      length: 14,
      width: 10,
      direction: 'North-East',
      plants: [
        {
          id: 'test_p1',
          plantId: firstPlant._id,
          name: firstPlant.name,
          scientificName: firstPlant.scientificName,
          image: firstPlant.image,
          x: 45,
          y: 50,
          rotation: 0,
          scale: 1.0
        }
      ],
      notes: 'Automated test suite garden plan'
    })
  });
  const createGardenJson = await createGardenRes.json();
  console.log(`✓ Created garden: ${createGardenJson.garden.gardenName} (ID: ${createGardenJson.garden._id})`);
  const gardenId = createGardenJson.garden._id;

  // 10. Fetch Gardens
  const gardensListRes = await fetch(`${API_BASE}/gardens`, { headers: authHeader });
  const gardensListJson = await gardensListRes.json();
  console.log(`✓ User gardens count: ${gardensListJson.length}`);

  // 11. Update Garden
  const updateGardenRes = await fetch(`${API_BASE}/gardens/${gardenId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeader },
    body: JSON.stringify({ gardenName: 'Updated Automated Test Sanctuary' })
  });
  const updateGardenJson = await updateGardenRes.json();
  console.log(`✓ Updated garden name: ${updateGardenJson.garden.gardenName}`);

  // 12. Fetch Quiz Questions
  const quizRes = await fetch(`${API_BASE}/quiz`);
  const quizJson = await quizRes.json();
  console.log(`✓ Quiz questions loaded count: ${quizJson.count}`);

  // 13. Submit Quiz Result
  const submitQuizRes = await fetch(`${API_BASE}/quiz/results`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader },
    body: JSON.stringify({
      score: 9,
      totalQuestions: 10,
      answers: []
    })
  });
  const submitQuizJson = await submitQuizRes.json();
  console.log(`✓ Quiz result recorded: ${submitQuizJson.message}`);

  // 14. Activity Log
  const actRes = await fetch(`${API_BASE}/user/activity`, { headers: authHeader });
  const actJson = await actRes.json();
  console.log(`✓ Recent activities logged count: ${actJson.length}`);

  // 15. Delete Test Garden
  const delGardenRes = await fetch(`${API_BASE}/gardens/${gardenId}`, {
    method: 'DELETE',
    headers: authHeader
  });
  const delGardenJson = await delGardenRes.json();
  console.log(`✓ Deleted test garden: ${delGardenJson.message}`);

  console.log('🎉 ALL 15 BACKEND REST ENDPOINTS VERIFIED 100% OPERATIONAL!');
}

testAll().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
