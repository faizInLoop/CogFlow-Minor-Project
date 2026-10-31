/**
 * Checked course notes. These are served as written.
 * A topic that is not listed here is not filled with a generic template.
 */

function note(what, why, example, check, mistake) {
  return `## What it is\n${what}\n\n## Why it matters\n${why}\n\n## One example\n${example}\n\n## Check yourself\n${check}\n\n## A common mistake\n${mistake}`;
}

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const COURSES = [
  {
    names: ['alphabet sounds and phonics adventures'],
    tier1: note(
      'A letter can stand for a sound. Phonics is the practice of saying the sound, then blending sounds into a word.',
      'Reading starts when a child can hear that c-a-t is cat. Writing starts from the same sounds.',
      'The word sun has three sounds: s, u, n. Say them slowly, then say the whole word.',
      'Say the first sound in map. Then say the last sound.',
      'Saying the letter name instead of the sound. The letter m is called em, but the sound in map is mmm.'
    ),
    tier3: note(
      'Phonics connects a written letter, or a small group of letters, to a spoken sound. A word is read by blending those sounds in order.',
      'Children who can blend sounds can read new regular words instead of memorizing every word as a picture.',
      'Ship uses sh for one sound, then i, then p. The h does not make a separate sound in this word.',
      'Which letters make one sound in the word chat? Blend the sounds in stop.',
      'Treating every letter as its alphabet name. Some pairs, such as sh, ch, and th, are one sound.'
    ),
    tier5: note(
      'English spelling is not one letter per sound. A phoneme can be spelled in more than one way, and one spelling can have more than one sound.',
      'A reader needs both the regular patterns and the exceptions. Sounding out works for many words and fails for words such as said or one.',
      'The long-a sound in cake is written a-consonant-e. The same sound in rain is written ai. Both are real patterns.',
      'Give two spellings of the long-a sound. Name one common word that cannot be read by a simple blend.',
      'Telling a learner that every word can be sounded out letter by letter. Irregular words have to be taught as exceptions.'
    ),
  },
  {
    names: ['counting numbers 1 to 50 and shapes'],
    tier1: note(
      'Counting means saying the number words in order and matching one word to one object. A shape is named by its sides.',
      'Counting tells how many. Shape names let a child describe what they see.',
      'Three blocks get the words one, two, three. A square has four equal sides.',
      'Count five fingers. How many sides does a triangle have?',
      'Saying the number words without touching one object at a time. The last number said is the total only if each object was counted once.'
    ),
    tier3: note(
      'The numbers 1 to 50 follow a base-ten pattern. After 9, the next numbers are one ten, then one ten and some ones: 10, 11, 12, and so on. A circle is round. A triangle has 3 sides, a square has 4 equal sides, and a rectangle has 4 sides with opposite sides equal.',
      'Place value is the reason 14 is not the same as 41. Shape names are the start of geometry.',
      '14 is 1 ten and 4 ones. A rectangle can be long and still have four sides.',
      'What is 1 ten and 6 ones? How is a square different from a rectangle?',
      'Counting 14 as one, four instead of fourteen, or calling every four-sided shape a square.'
    ),
    tier5: note(
      'A count is correct when the objects and the number words are in one-to-one order and the last word names the set. Place value means the position of a digit changes its value by a factor of ten.',
      'This is the same idea later used for addition with regrouping and for measuring.',
      'Twenty-three is 2 tens and 3 ones, which is 20 + 3. A square is a special rectangle because all four sides are equal and the corners are right angles.',
      'Write 37 as tens and ones. Why is a square a rectangle, while a long rectangle is not a square?',
      'Thinking the digit 2 in 23 means two, rather than two tens.'
    ),
  },
  {
    names: ['animals nature and our wonderful world'],
    tier1: note(
      'Animals are living things that move, eat, and grow. Plants, water, soil, and weather are part of the same world.',
      'Naming what lives nearby is the start of science. It teaches a child to look carefully.',
      'A bird has feathers and lays eggs. A fish has fins and lives in water. A dog has fur and feeds milk to its young.',
      'Name one animal that flies and one that swims. What does a plant need from the sun?',
      'Calling every small animal an insect. A spider has eight legs and is not an insect. Insects have six legs.'
    ),
    tier3: note(
      'Living things need food, water, and a place to live. Animals get food by eating. Plants make food using light. A habitat is the place that supplies those needs.',
      'If the habitat changes, the animals that depend on it change too. That is why litter, drought, and cutting down trees matter.',
      'A frog lives near water because its eggs and young need water. A camel can live in a dry place because it stores resources and loses less water.',
      'What is a habitat? Why does a fish not live on dry land?',
      'Saying animals can live anywhere. Each animal is suited to particular food, water, and shelter.'
    ),
    tier5: note(
      'A habitat supplies food, water, shelter, and space. Animals are grouped by features: mammals have hair and feed milk to their young, birds have feathers, fish have gills, reptiles have scales, and amphibians often live both in water and on land.',
      'These groups are a classification, not a ranking. They help predict how an animal lives.',
      'A whale lives in water but is a mammal: it has lungs and feeds milk to its calf. A shark is a fish and breathes with gills.',
      'Why is a whale a mammal? Name the feature that separates a bird from a bat.',
      'Grouping an animal only by where it lives. A bat flies, but it is a mammal, not a bird.'
    ),
  },
  {
    names: ['daily good habits and healthy routines'],
    tier1: note(
      'A habit is something you do again and again. Healthy habits include washing hands, brushing teeth, sleeping, and eating regular meals.',
      'Small daily actions keep the body clean and rested. They are easier when they happen at the same time each day.',
      'Wash hands with soap before eating and after using the toilet. Brush teeth in the morning and at night.',
      'Name two times to wash hands. Why do we brush teeth?',
      'Thinking one wash is enough for the whole day. Germs are picked up again, so hands are washed at the times that matter.'
    ),
    tier3: note(
      'A routine is a repeated order of actions. Sleep, meals, movement, handwashing, and tooth brushing are the basic health routine for a child.',
      'Sleep helps the body recover. Food supplies energy. Washing removes germs before they reach the mouth. Brushing removes the film that causes tooth decay.',
      'A useful evening order is: wash, brush teeth, then sleep at a set time. A useful morning order is: toilet, wash, brush, then breakfast.',
      'Why is sleep part of health, not only a rest from school? When should hands be washed?',
      'Skipping breakfast and then eating only sweets. The body needs a regular meal, not only sugar.'
    ),
    tier5: note(
      'Habits stick when the cue, the action, and the place stay the same. Health routines work because they are repeated, not because one perfect day changes the body.',
      'This is practical self-management. It is not a medical treatment and does not replace a doctor when someone is ill.',
      'Putting the toothbrush by the sink makes the cue visible. Going to bed after the same short routine makes sleep more regular.',
      'What makes a habit easier to keep? Why is one healthy day not the same as a routine?',
      'Treating a routine as optional once you feel well. The benefit comes from repeating it.'
    ),
  },
  {
    names: ['math explorers addition subtraction and tables'],
    tier1: note(
      'Addition puts amounts together. Subtraction takes an amount away. A table is the list of answers for adding or multiplying the same numbers.',
      'These are the operations used for money, sharing, and measuring.',
      '3 + 2 = 5 because three objects and two more make five. 5 − 2 = 3 because two are taken away.',
      'What is 4 + 3? What is 8 − 1?',
      'Adding when the question asks how many are left. Left means subtraction.'
    ),
    tier3: note(
      'Addition and subtraction are inverse operations: 7 + 5 = 12, so 12 − 5 = 7. Multiplication is repeated addition, so 4 × 3 = 3 + 3 + 3 + 3 = 12. A multiplication table stores these results so they do not have to be rebuilt every time.',
      'Knowing the facts up to 10 × 10 makes later division, fractions, and larger arithmetic faster and less error-prone.',
      'If 6 × 7 = 42, then 42 ÷ 7 = 6. The table gives both facts.',
      'If 9 + 4 = 13, what is 13 − 4? What is 5 × 6?',
      'Memorizing a table without knowing that multiplication is repeated addition. The table is a memory aid, not a different kind of number.'
    ),
    tier5: note(
      'The same sum can be written in more than one order: 8 + 5 = 5 + 8. Subtraction cannot be swapped: 8 − 5 is not 5 − 8. Multiplication also keeps the same product when the factors swap: 4 × 6 = 6 × 4.',
      'These properties let a student check work and choose an easier order.',
      'To add 9, a student can add 10 and then subtract 1. 27 + 9 = 37 − 1 = 36. The table fact 9 × 6 = 54 can be checked as 10 × 6 − 6.',
      'Why can you swap the numbers in 7 × 8 but not in 15 − 8? Show one way to check 8 × 7.',
      'Using a calculator for a basic fact and never checking whether the result is reasonable.'
    ),
  },
  {
    names: ['the solar system and space wonders'],
    tier1: note(
      'The Sun is a star. Earth and the other planets travel around it. Earth also spins, which makes day and night.',
      'This explains why the Sun appears to move across the sky and why a year is one trip around the Sun.',
      'Earth takes about 365 days to go around the Sun. The Moon goes around Earth.',
      'What makes day and night? What does Earth orbit?',
      'Saying the Sun moves around Earth. Earth is moving. The Sun is the center of the planet orbits.'
    ),
    tier3: note(
      'The solar system is the Sun and everything bound to it by gravity: eight planets, their moons, dwarf planets, asteroids, and comets. The inner planets Mercury, Venus, Earth, and Mars are rocky. Jupiter, Saturn, Uranus, and Neptune are much larger and made mostly of gas or ice.',
      'Gravity from the Sun keeps the planets in orbit. Earth orbit gives the year. Earth rotation gives day and night.',
      'Earth has one large moon. Jupiter has many moons because it is much more massive. Saturn is known for its rings of ice and rock.',
      'Name the four rocky planets. What motion causes a year?',
      'Counting Pluto as one of the eight planets. Pluto is a dwarf planet. Also, seasons are not caused by Earth moving closer to the Sun. They are caused mainly by the tilt of Earth axis.'
    ),
    tier5: note(
      'An orbit is a continuous fall around a body. The planet speed and the Sun gravity balance so the planet does not fly off and does not fall into the Sun. Earth axis is tilted by about 23.5 degrees, so each hemisphere gets more direct sunlight for part of the year.',
      'That tilt, not the distance from the Sun, is the main cause of seasons. Earth is actually closest to the Sun in early January.',
      'In June, the northern hemisphere tilts toward the Sun, so days there are longer and the Sun is higher. The southern hemisphere has winter then.',
      'Why is it summer in one hemisphere while it is winter in the other? What keeps a planet in orbit?',
      'Teaching that summer happens because Earth is closer to the Sun. Both hemispheres would then have summer together, and they do not.'
    ),
  },
  {
    names: ['plants photosynthesis and animal habitats'],
    tier1: note(
      'A plant uses light, water, and air to make its food. That process is photosynthesis. A habitat is the place where an animal finds food, water, and shelter.',
      'Plants are the start of most food chains. Animals depend on the place that supplies what they need.',
      'A leaf takes in light. A cactus lives in a dry habitat. A frog needs a wet one.',
      'What three things does a plant use to make food? Name a habitat and one animal that lives there.',
      'Saying plants eat soil. Soil can hold water and minerals. The food is made in the leaves using light.'
    ),
    tier3: note(
      'Photosynthesis happens mainly in leaves. Chlorophyll captures light. The plant takes in carbon dioxide and water and produces sugar and oxygen. The sugar is the plant food. Animals then eat plants, or eat animals that ate plants.',
      'A habitat matches an animal to food, water, shelter, and climate. Change the habitat and the animal may not survive there.',
      'A rainforest plant gets plenty of water and light competition is high, so many leaves grow broad. A desert plant stores water and has a small leaf surface. A polar bear habitat is cold sea ice, where it hunts seals.',
      'What gas does a plant take in during photosynthesis, and what gas does it release? Why can a fish not use a desert as its habitat?',
      'Saying animals make food the same way plants do. Animals must eat. Only organisms with chlorophyll carry out photosynthesis.'
    ),
    tier5: note(
      'The overall photosynthesis change is carbon dioxide plus water, using light energy, producing sugar and oxygen. The plant later breaks sugar down for energy, including at night, so it also uses oxygen. A habitat is not just a location. It is the set of conditions the organism can use.',
      'This is why cutting a forest or draining a wetland removes both the producers and the animals that depend on them.',
      'Algae in water also photosynthesize and release oxygen. A coral reef habitat depends on clear, warm, shallow water and on the food produced there.',
      'Does a plant only produce oxygen, or does it also use oxygen? What happens to animals when their habitat no longer supplies food or shelter?',
      'Claiming photosynthesis means a plant never respires. Making sugar and using sugar are both real processes.'
    ),
  },
  {
    names: ['the amazing water cycle and weather'],
    tier1: note(
      'Water moves from the ground and oceans into the air, then comes back as rain or snow. That movement is the water cycle. Weather is what the air is doing now: sun, cloud, rain, wind, or temperature.',
      'The cycle is why puddles disappear and why rain returns. Weather is the day-to-day result of that air and water.',
      'The Sun warms a puddle. The water becomes vapor. It later forms a cloud and can fall as rain.',
      'Where does puddle water go? Name two kinds of weather.',
      'Thinking the water is gone forever when a puddle dries. It changed into vapor.'
    ),
    tier3: note(
      'The water cycle has four main moves. Evaporation turns liquid water into vapor. Condensation turns vapor into droplets, which make clouds. Precipitation is rain, snow, sleet, or hail. Collection returns that water to rivers, lakes, oceans, and groundwater. Weather is the short-term state of the air. Climate is the usual pattern over many years.',
      'The amount of water on Earth stays about the same. It changes place and state. Weather forecasts describe the current movement of air and water, not a permanent change.',
      'A warm day over a lake increases evaporation. If that moist air rises and cools, clouds form. If the droplets grow heavy, rain falls back into the lake.',
      'Name the four moves of the water cycle. How is weather different from climate?',
      'Saying clouds are smoke, or that rain is new water made in the sky. The water was already on Earth.'
    ),
    tier5: note(
      'Cooling moist air to its dew point causes condensation. Rising air cools, which is why clouds often form when air is pushed up by mountains or by warm air rising. Wind moves that moisture from one place to another.',
      'This connects the cycle to weather: temperature, humidity, and rising air decide whether vapor stays invisible or falls as precipitation.',
      'Air that crosses a warm ocean can pick up vapor. If it later rises over land and cools, that vapor becomes rain. A desert can stay dry if the air descends and warms, which works against cloud formation.',
      'Why does rising air help clouds form? What is the difference between a rainy day and a rainy climate?',
      'Using one storm to claim the climate has changed. Climate is the long pattern. One day is weather.'
    ),
  },
  {
    names: ['newtons laws of motion and gravitation'],
    tier1: note(
      'A still object stays still, and a moving object keeps moving, unless a force changes that. A force can speed an object up, slow it down, or turn it. Heavier objects need more force for the same change. Near Earth, gravity pulls objects downward.',
      'These rules explain ordinary pushes, falls, and stops.',
      'A ball on a table stays put until you push it. It stops because friction pushes the other way. Dropped, it falls because of gravity.',
      'What changes an object motion? What force pulls a dropped book down?',
      'Saying a moving ball stops by itself. Something, usually friction or a collision, is the force that stops it.'
    ),
    tier3: note(
      'Newton first law: velocity stays constant, including zero, unless a net force acts. Second law: net force equals mass times acceleration, F = ma. Third law: forces come in pairs. If you push a wall, the wall pushes back on you. Near Earth surface, gravity accelerates objects downward at about 9.8 m/s², so weight is mass times that acceleration.',
      'The laws separate the force you apply from the motion that results. They are the start of mechanics.',
      'A 2 kg box with a net force of 6 N accelerates at 3 m/s². Your weight on Earth is greater than your weight on the Moon because the Moon gravitational acceleration is smaller, not because your mass changed.',
      'A book rests on a table. Which forces cancel? If the net force on a 4 kg object is 8 N, what is its acceleration?',
      'Thinking a constant force is needed to keep constant speed on a frictionless surface. With no net force, the speed stays as it is. Also, the third-law pair never acts on the same object.'
    ),
    tier5: note(
      'Newton second law uses net force, the vector sum. Individual forces can be large while the net force is zero, as in a book at rest. Gravitation between two masses is G m1 m2 / r². The surface value 9.8 m/s² is the local result of Earth mass and radius, not a universal constant of motion.',
      'Leaving out friction, the normal force, or air resistance makes a prediction fail even when the law is right.',
      'A skydiver reaches terminal speed when air resistance upward equals weight downward. Net force is then zero, so acceleration is zero, but the velocity is not zero.',
      'Why can acceleration be zero while velocity is not? Which force is missing if a sliding block is predicted to move forever on a real floor?',
      'Putting both members of a third-law pair on the free-body diagram of one object. Each object gets only the forces acting on it.'
    ),
  },
  {
    names: ['atoms chemical bonds and periodic table'],
    tier1: note(
      'Everything you can touch is made of atoms. An atom has a tiny positive nucleus and negative electrons around it. A bond holds atoms together. The periodic table lists the elements in a pattern.',
      'The pattern lets you predict which elements behave in a similar way.',
      'Water is two hydrogen atoms bonded to one oxygen atom. Oxygen and sulfur sit in the same column and share some chemical behavior.',
      'What is water made of? What does a column in the periodic table group together?',
      'Saying an atom is a small version of the material with no parts. Atoms have a nucleus and electrons.'
    ),
    tier3: note(
      'An atom has protons and neutrons in the nucleus and electrons around it. The number of protons is the atomic number and decides the element. A chemical bond forms when atoms share or transfer electrons. An ionic bond moves electrons from one atom to another. A covalent bond shares electrons. The periodic table orders elements by atomic number, and elements in the same column have similar outer-electron patterns.',
      'Bond type helps explain why salt dissolves as charged particles and why oxygen gas is made of atom pairs.',
      'Sodium chloride is ionic: sodium gives up an electron and chlorine takes it. The oxygen molecule O₂ is covalent: the two atoms share electrons.',
      'What number identifies an element? How is an ionic bond different from a covalent bond?',
      'Changing the proton count and calling it the same element. Change the protons and you have a different element. Also, the table is ordered by protons, not by the discovery date.'
    ),
    tier5: note(
      'Electrons occupy shells, and the outer shell dominates ordinary bonding. Elements in a column have the same number of outer electrons, which is why their reactions rhyme. A full outer shell, as in the noble gases, is a reason those elements rarely bond.',
      'This is a model. It predicts the common compounds. It does not by itself give the exact energy of every reaction.',
      'Neon has a full outer shell and is almost inert. Fluorine has seven outer electrons and readily gains one, which is why it forms compounds such as hydrogen fluoride.',
      'Why are the noble gases unreactive? What stays the same for elements in one column?',
      'Drawing electrons as planets on fixed tracks. The shell model is a useful count of electrons, not a picture of little orbits you could see.'
    ),
  },
  {
    names: ['cell biology and human anatomy'],
    tier1: note(
      'A cell is the smallest living unit of a plant or animal. The human body is made of organs, such as the heart, lungs, stomach, and brain, and each organ does a job.',
      'Understanding cells and organs explains how the body works and why damage to one part affects the rest.',
      'A muscle cell helps you move. The heart pumps blood. The lungs take in oxygen.',
      'What is a cell? Name two organs and their jobs.',
      'Saying the heart makes blood. The heart pumps blood. Blood is made mainly in bone marrow.'
    ),
    tier3: note(
      'A cell has a membrane, cytoplasm, and genetic material. An animal cell has a nucleus that holds DNA. A plant cell also has a cell wall and chloroplasts. Tissues are groups of similar cells. Organs are structures with a job: the heart pumps blood, the lungs exchange gases, the stomach begins digestion, and the brain processes signals.',
      'The body is organized from cell, to tissue, to organ, to organ system. A fault at the cell level can appear as organ disease.',
      'Red blood cells carry oxygen. They work with the lungs, which load oxygen, and the heart, which moves the blood.',
      'How is a plant cell different from an animal cell? Which organ exchanges oxygen, and which organ pumps blood?',
      'Treating an organ as independent of cells. The organ job is what its cells do together.'
    ),
    tier5: note(
      'DNA in the nucleus stores instructions. Ribosomes build proteins from those instructions. Mitochondria release usable energy from food. Organ systems connect the jobs: the circulatory system moves materials, the respiratory system exchanges gases, and the digestive system breaks food into molecules cells can use.',
      'Anatomy names the parts. Physiology is how those parts work. A lesson that only names organs has not explained the function.',
      'Glucose from digestion and oxygen from breathing meet at cells. Mitochondria use them to release energy. Without either one, that energy release fails.',
      'Where are the instructions for proteins stored? Why do the lungs and the digestive system both matter to a muscle cell?',
      'Saying the nucleus is the cell power source. The nucleus holds DNA. Mitochondria are the main site of usable energy release.'
    ),
  },
  {
    names: ['algebra trigonometry and geometry'],
    tier1: note(
      'Algebra uses a letter for an unknown number and keeps both sides of an equation equal. Geometry studies shapes, angles, and lengths. Trigonometry relates an angle in a right triangle to the ratios of its sides.',
      'These are the tools for solving an unknown and for measuring lengths you cannot pace out.',
      'If x + 3 = 10, then x = 7. A right triangle has one 90 degree angle. The sine of an acute angle is opposite side divided by hypotenuse.',
      'Solve x + 5 = 12. In a right triangle, which side is the hypotenuse?',
      'Adding a number to one side of an equation and not the other. The two sides stop being equal.'
    ),
    tier3: note(
      'An equation stays true if you do the same operation to both sides. Geometry measures figures: the interior angles of a triangle add to 180 degrees, and the area of a rectangle is length times width. In a right triangle, sin θ = opposite / hypotenuse, cos θ = adjacent / hypotenuse, and tan θ = opposite / adjacent.',
      'Algebra finds an unknown. Trigonometry finds a side or an angle when one right-triangle measure is known. Geometry gives the relations those measures must obey.',
      'A rectangle 4 by 6 has area 24. If a right triangle has opposite side 3 and hypotenuse 5, sin θ = 3/5.',
      'Solve 2x + 1 = 9. What is the sum of angles in a triangle? Write the definition of cosine.',
      'Using sine for the adjacent side. Sine is opposite over hypotenuse. Also, these three ratios are for right triangles unless a more general rule is stated.'
    ),
    tier5: note(
      'The Pythagorean theorem says a² + b² = c² for the legs and hypotenuse of a right triangle. It connects geometry to algebra. The trigonometric ratios are consistent with it: if sin θ = a/c and cos θ = b/c, then sin² θ + cos² θ = 1.',
      'That identity is a check. If a calculated sine and cosine do not satisfy it, a side was assigned wrong.',
      'A 3-4-5 triangle is right-angled because 9 + 16 = 25. The sine of the angle opposite 3 is 3/5, and the cosine of that same angle is 4/5.',
      'Show that sin² θ + cos² θ = 1 for the 3-4-5 triangle. What fails if you use the theorem on a triangle that is not right-angled?',
      'Applying a² + b² = c² to any triangle. It is a right-triangle theorem.'
    ),
  },
  {
    names: ['data structures and memory hierarchy'],
    tier1: note(
      'A data structure is a way to organize values so a program can store and find them. An array keeps values in one block. A linked list keeps values in separate nodes joined by pointers. Memory hierarchy is a different idea: the CPU has a few very fast registers, then small caches, then larger RAM, then a much slower disk.',
      'The organization decides how many steps a lookup takes. The memory level decides how long each step waits.',
      'Item 5 of an array is reached by calculating its address. Item 5 of a linked list is reached by following five links. A value used right now may sit in a register. A large file sits on disk.',
      'How do you reach one item in an array? Which is faster to read, a CPU cache or a disk?',
      'Saying a linked list can jump straight to any position. Only the first node is immediate. Also, a data structure is not the same thing as a level of memory.'
    ),
    tier3: note(
      'An array stores items in contiguous addresses, so the address of index i is base + i × item size. That is why index access is O(1). A linked list stores nodes separately, so reaching index i takes O(i) steps. A hash table turns a key into a bucket index and is O(1) on average when collisions stay short. A balanced search tree keeps search, insert, and delete at O(log n).',
      'The memory hierarchy runs from registers, to L1, L2, and L3 caches, to RAM, to SSD or disk. Each step is larger and slower. A contiguous array often uses a cache line well because the next items are neighbors. A linked list often misses cache because the next node can be anywhere in RAM.',
      'Summing one million array integers and summing one million linked-list integers are both O(n) steps. The array is usually faster because consecutive addresses share cache lines.',
      'Why is array indexing O(1)? Why can a linked list be slower than an array even when both need n steps?',
      'Calling hash-table lookup O(1) in the worst case. Average lookup is O(1) when collisions stay short. A long collision chain is O(n). Another mistake is treating a data structure and a memory level as the same thing. An array is a structure. RAM is a memory level.'
    ),
    tier5: note(
      'Cache lines are the unit the CPU fetches, often 64 bytes. An array scan uses those bytes. Pointer chasing does not. A dynamic array resize copies n items occasionally. The cost spread over the following insertions is why append is amortized O(1), even though one resize is O(n). A B+ tree keeps many keys in one node so a disk page holds a useful fanout. That is a data structure designed around the cost of disk, not around RAM.',
      'Choosing a structure is choosing both the operation costs and the memory traffic. Big-O does not include the cache miss.',
      'A binary heap supports priority-queue extract-min in O(log n) and is stored in an array, so parent and child indexes are calculated, not stored as pointers. That layout is cache-friendlier than a pointer tree.',
      'Why is dynamic-array append amortized O(1)? What problem is a B+ tree aimed at that a RAM binary tree is not?',
      'Quoting O(1) or O(log n) as the whole performance story. A structure with good step counts can still be slow if every step misses the cache or touches disk.'
    ),
  },
  {
    names: ['algorithms and complexity theory'],
    tier1: note(
      'An algorithm is a finite list of steps that solves a problem. Complexity asks how the number of steps grows as the input gets larger.',
      'A method that is fine for 10 items can be useless for 10 million if the steps grow too fast.',
      'Finding a name in an unsorted list may check every name. Finding it in a sorted list can halve the remaining names each time. That second method is binary search.',
      'Which search throws away half the list each time? What does complexity describe?',
      'Judging an algorithm by one small example. The growth matters when the input gets large.'
    ),
    tier3: note(
      'Big-O describes an upper bound on growth. O(1) stays flat, O(log n) grows very slowly, O(n) grows in step with the input, O(n log n) is typical of efficient sorting, and O(n²) compares roughly every pair. Binary search on a sorted array is O(log n). A linear scan is O(n). Merge sort is O(n log n).',
      'Complexity lets you compare methods before running them. It does not replace a measurement, but it rules out methods that cannot scale.',
      'Searching 1,000,000 sorted items takes about 20 halvings with binary search, and up to 1,000,000 checks with a scan.',
      'What does O(n²) say about growth? Why does binary search require sorted data?',
      'Treating Big-O as the exact running time in seconds. It hides constants and memory effects. A slow O(n) can beat a fast-looking O(log n) for tiny inputs.'
    ),
    tier5: note(
      'Big-O is an upper bound, Big-Omega a lower bound, and Big-Theta a tight bound. A problem can be harder than any particular algorithm: comparison sorting is Omega(n log n) in the comparison model. NP-complete problems, such as general boolean satisfiability and the traveling salesman decision problem, have no known polynomial algorithm, and a polynomial algorithm for one of them would give one for all of them.',
      'That distinction stops a student from promising a fast exact algorithm for a problem that is believed not to have one.',
      'You can sort with merge sort in O(n log n). You should not promise a similar simple bound for the shortest route through every city unless you change the problem or accept an approximation.',
      'How is an algorithm bound different from a problem bound? What would a polynomial algorithm for one NP-complete problem imply?',
      'Calling a problem impossible because one algorithm was slow. A different algorithm may be fine. The stronger claim needs a problem lower bound.'
    ),
  },
  {
    names: ['operating systems and kernel internals'],
    tier1: note(
      'An operating system manages programs, memory, and devices so they can share one computer. A process is a running program. The kernel is the part that has direct control of the hardware.',
      'Without it, every program would have to control the disk, the screen, and the memory itself, and programs would overwrite each other.',
      'When you open two apps, the system gives each a turn on the CPU and a separate region of memory.',
      'What is a process? What does the kernel control?',
      'Thinking each app owns the whole computer while it runs. The system is switching among them.'
    ),
    tier3: note(
      'A process has its own address space. A thread is a schedulable execution inside a process, and threads in one process share that address space. The scheduler chooses which thread runs. Virtual memory gives each process the illusion of a private memory range. The hardware translates those addresses with page tables. A system call is the controlled entry from a program into the kernel.',
      'Separate address spaces stop a fault in one process from rewriting another process memory.',
      'A browser tab crash stops that process. The operating system keeps running. Reading a file is a system call: the program asks, and the kernel performs the read.',
      'How is a thread different from a process? What does virtual memory isolate?',
      'Saying the kernel is just another app. User programs ask the kernel. They do not freely run the privileged instructions.'
    ),
    tier5: note(
      'The CPU privilege levels stop user code from changing page tables or talking to devices directly. On a page fault, the kernel decides whether to load the missing page or to stop the process. Locks and semaphores protect shared data. A deadlock needs the usual conditions: mutual exclusion, hold and wait, no preemption, and a circular wait. Removing one of them is the basis of prevention.',
      'These mechanisms are why concurrency bugs are about ordering, not only about being fast.',
      'Two threads incrementing one shared counter without a lock can lose updates. The kernel scheduler can switch between the read and the write.',
      'Why can two correct-looking increments lose a count? Name one condition required for deadlock.',
      'Assuming a race disappears on a faster CPU. The interleaving is still allowed. Speed changes how often you see it, not whether the bug exists.'
    ),
  },
  {
    names: ['computer networks and modern protocols'],
    tier1: note(
      'A network moves messages between computers. A protocol is the agreed format and order of those messages. An IP address identifies a machine. A packet is one piece of a larger message.',
      'Shared rules are the reason a browser on one computer can request a page from another.',
      'Loading a page sends a request to the server address and receives the page back in packets, which are put in order.',
      'What is a protocol? What does an IP address identify?',
      'Thinking the whole file travels as one solid object. It is split into packets and reassembled.'
    ),
    tier3: note(
      'IP delivers packets using addresses and does not by itself guarantee arrival. TCP adds a connection, sequence numbers, retransmission, and flow control so bytes arrive reliably and in order. UDP sends datagrams without that guarantee, which is useful when a late packet is worthless, as in some live calls. HTTP is an application protocol on top of a transport protocol. DNS turns a name such as a website into an IP address.',
      'Choosing TCP or UDP is choosing whether the application or the transport handles loss.',
      'A file download uses TCP because a missing byte ruins the file. A live voice call may use UDP because a retransmitted sound can arrive too late to play.',
      'What does TCP add that IP does not? When is UDP a reasonable choice?',
      'Saying IP guarantees delivery. It does not. Reliability, when present, comes from a higher protocol such as TCP.'
    ),
    tier5: note(
      'TCP reliability uses acknowledgements and retransmission. Congestion control slows the sender when the network is overloaded, which is separate from flow control that protects the receiver buffer. HTTP request methods such as GET and POST have different meanings: GET should fetch and POST submits. TLS sits between the application data and the transport so the bytes are authenticated and encrypted.',
      'A correct application still fails if it assumes a protocol guarantee the layer does not give.',
      'A GET that changes data on the server breaks the usual meaning of GET and can be repeated by a client or a cache. A state change belongs with a method that means submission.',
      'How is congestion control different from flow control? Why is a repeated GET a problem if the server treats it as a purchase?',
      'Putting passwords in a URL or trusting plain HTTP for a secret. Confidentiality needs TLS, not only a correct IP address.'
    ),
  },
  {
    names: ['machine learning mathematical foundations'],
    tier1: note(
      'Machine learning fits a rule to examples. The rule is then used on a new example. The fit is judged by how wrong the predictions are.',
      'This is different from writing every answer by hand. The quality depends on the examples and on the error you measure.',
      'A spam filter learns from messages already marked spam or not spam. It then scores a new message.',
      'What does the model learn from? What tells you the model is wrong?',
      'Thinking more data always fixes a bad label. If the examples are mislabeled, the fitted rule copies the mistake.'
    ),
    tier3: note(
      'A supervised model learns a function from inputs to labels. Training minimizes a loss, such as squared error for numbers or cross-entropy for classes. A separate test set estimates error on examples the model did not train on. Overfitting means the training error is low while the test error is high.',
      'The split between training and testing is what keeps a memorized dataset from looking like understanding.',
      'A model that remembers every training email can score perfectly on those emails and still fail on a new one. The test set reveals that.',
      'What is overfitting? Why is the test set kept out of training?',
      'Reporting only training accuracy. That number can be excellent for a model that will fail on new data.'
    ),
    tier5: note(
      'Gradient descent changes parameters in the direction that reduces the loss. A derivative says which way is down. Regularization adds a penalty for overly flexible parameters so the fit is less tied to noise. Bias is error from a too-simple model. Variance is error from a model that chases the particular sample.',
      'These words name different failures. Collecting more data mainly helps variance. A richer model is what helps bias, at the risk of more variance.',
      'A straight line cannot fit a clearly curved relationship. That is bias. A high-degree polynomial through a few noisy points bends to the noise. That is variance.',
      'Which problem does more data address more directly, bias or variance? What does the gradient tell the optimizer?',
      'Tuning the model on the test set until the test score looks good. The test set then stops being an honest estimate.'
    ),
  },
  {
    names: ['deep learning and neural networks'],
    tier1: note(
      'A neural network is a stack of simple calculations. Each layer turns a list of numbers into another list. Training adjusts the strengths of those connections so the final list matches the desired answer more often.',
      'Depth lets the model build intermediate features instead of only a single weighted sum.',
      'A photo can be turned into numbers. Early layers respond to edges. Later layers respond to shapes such as an eye or a wheel. The last layer names the object.',
      'What is changed during training? What does a later layer use as its input?',
      'Saying the network understands a picture the way a person does. It is adjusting numbers to reduce an error.'
    ),
    tier3: note(
      'Each unit computes a weighted sum of its inputs and then applies a nonlinear function such as ReLU. Without the nonlinear function, a stack of layers collapses into one linear function. Training uses backpropagation: the output error is passed backward so each weight can be updated. A convolutional network reuses a small filter across an image, which matches the idea that an edge can appear anywhere.',
      'The architecture is chosen to match the data. Images use local patterns. A plain fully connected net does not assume that.',
      'Recognizing a digit, the first filters often detect strokes. The last layer outputs ten scores, one per digit, and the largest score is the prediction.',
      'Why is a nonlinear function required between layers? What does a convolutional filter reuse?',
      'Adding layers and expecting accuracy to rise forever. A deeper net can fail to train, overfit, or be slower without a better result.'
    ),
    tier5: note(
      'Backpropagation applies the chain rule. Vanishing gradients happen when repeated multiplications by small derivatives shrink the update, which is a known problem for deep sigmoids. ReLU reduces that particular problem for positive activations, but a dead ReLU can stop updating if it stays at zero. Batch normalization and residual connections are standard ways to make deep stacks trainable. None of them guarantees a correct model.',
      'The training loss going down means the optimizer is working on the training data. It does not mean the model is fair, robust, or right outside that data.',
      'A residual block lets a layer learn a change added to its input, so a deep stack can at least represent the identity function if the change is zero.',
      'What does the chain rule have to do with training? Why is a lower training loss not proof of a good model?',
      'Describing the network as storing a rule in English. The stored object is weights. Any explanation in words is an interpretation, and it can be wrong.'
    ),
  },
  {
    names: ['transformers and large language models'],
    tier1: note(
      'A large language model predicts the next piece of text from the pieces it has already seen. A transformer is the network design most of these models use. Attention lets a word depend more on some earlier words than on others.',
      'Prediction is not the same as looking up a checked fact. The model can produce a fluent sentence that is wrong.',
      'Given the words the capital of France is, a trained model often continues with Paris. That is a likely continuation, learned from text, not a database query.',
      'What does the model predict? Why can a fluent answer still be false?',
      'Treating confidence in the wording as proof. Fluency is the training target. Truth has to be checked.'
    ),
    tier3: note(
      'A transformer block uses self-attention and a small feed-forward network. Self-attention computes, for each token, a weighted mix of the other tokens. The weights come from comparisons between queries and keys. The model is trained to predict a hidden token or the next token on a very large text collection. A chatbot then adds a further instruction-tuning stage so the predictions look like answers.',
      'The limitation follows from the objective. The model was rewarded for likely text. It was not given a guarantee that each sentence is true.',
      'Asked for a citation, the model may produce a title and author that fit the pattern of citations without that paper existing. The form was learned. The record was not checked.',
      'What is self-attention mixing? Why is a likely sentence different from a verified one?',
      'Saying the model retrieves your documents unless a retrieval system was actually attached. A base model continues from its prompt and its weights.'
    ),
    tier5: note(
      'Attention is a weighted sum. The weights are a softmax over scaled dot products of queries and keys, and the values are what get mixed. Positional information has to be added because attention by itself does not know order. Context length is finite. Tokens outside the window are not read. Instruction tuning and preference tuning change which continuations are preferred. They do not turn next-token training into a proof system.',
      'Use the model to draft, summarize, or transform text you can check. Do not use an unchecked completion as a source of record.',
      'A summary of a paper you provide can be compared with the paper. A summary of a paper you only name can invent methods that are not in it.',
      'What does attention mix, and what does it not know unless position is supplied? Why does a finite context window matter?',
      'Explaining a wrong answer as the model hiding the truth. The ordinary failure is a plausible continuation that nobody verified.'
    ),
  },
  {
    names: ['autonomous ai agents and reinforcement learning'],
    tier1: note(
      'Reinforcement learning trains a choice by reward and penalty after actions, not by showing the correct action each time. An agent is a system that chooses actions to pursue a goal.',
      'This fits games and control, where the good move is known by the later score.',
      'A game agent tries a move, then gets a point for a win or a penalty for a loss. It prefers moves that led to points.',
      'What signal trains the agent? How is that different from being shown the right answer?',
      'Expecting the agent to be safe just because the score went up. The score is whatever was written down. If the score ignores harm, the agent can learn the harm.'
    ),
    tier3: note(
      'An agent observes a state, chooses an action, and receives a reward. The goal is usually to maximize the sum of future rewards, often with later rewards discounted. A policy is the rule from state to action. Q-learning estimates the value of taking an action in a state. A planner such as a tool-using software agent is different: it chooses steps with a language model and tools, and it is not automatically a reinforcement-learning policy.',
      'The reward definition is the real specification. A misspecified reward produces the wrong behavior with confidence.',
      'A robot rewarded only for moving forward can learn to fall downhill. The reward never said to stay upright.',
      'What is a policy? Why can a higher reward still be the wrong behavior?',
      'Calling every chatbot agent a reinforcement-learning system. Using tools in a loop is not the same training method as learning from a reward signal.'
    ),
    tier5: note(
      'Discounting by a factor γ means a reward k steps ahead is weighted by γ^k. Exploration tries uncertain actions. Exploitation uses the current best estimate. Q-learning updates an action value from the reward plus the discounted best next value. It can diverge with some function approximators. Policy gradient methods change the policy parameters from the observed return. Credit assignment is hard when the reward arrives long after the important action.',
      'These limits are why a demo win is not a proof of a stable controller.',
      'In chess, a mistake on move 10 may be visible only as a loss on move 40. The learning rule has to assign that loss back to the earlier move, and it can assign it to the wrong one.',
      'What is the difference between exploration and exploitation? Why is a delayed reward hard to learn from?',
      'Setting γ = 1 and an unbounded episode without checking that the return is finite. The objective may not be well defined.'
    ),
  },
  {
    names: ['distributed consensus and cap theorem'],
    tier1: note(
      'Consensus means several computers agree on one value even if some of them fail. The CAP idea says that during a network split you cannot have perfect consistency and perfect availability at the same time.',
      'Agreement is what keeps two copies from quietly diverging. The split forces a choice between refusing some requests and risking disagreement.',
      'If a network break separates a cluster, one side can stop accepting writes so it does not disagree with the other side. That choice favors consistency. The other choice is to keep accepting writes and repair later.',
      'What does consensus agree on? During a partition, what two goals cannot both be perfect?',
      'Saying a product is CAP-proof. During a real partition, a system chooses a behavior. It does not escape the choice.'
    ),
    tier3: note(
      'A consensus protocol such as Raft elects a leader and replicates a log. An entry is committed when a majority has stored it. A later leader must contain all committed entries, which is how the protocol avoids losing an agreed value. CAP, stated carefully, is about a partition: a distributed store cannot provide both linearizable consistency and availability for every request while the partition lasts.',
      'Majority replication is the usual way to stay consistent when a minority is cut off. The minority should not keep serving writes that can diverge.',
      'In a cluster of five, a partition of 3 and 2 lets the group of 3 elect a leader and commit. The group of 2 cannot commit, because it is not a majority.',
      'Why is a majority required to commit? What does the group of 2 give up during the partition?',
      'Treating CAP as three independent dials you can set to yes. The claim is specifically about behavior during a partition, not about normal operation.'
    ),
    tier5: note(
      'Raft safety depends on election rules and on the leader log. A candidate can win only if its log is at least as up to date as a majority. That prevents a leader from being elected without committed entries. Availability in the CAP sense means every request to a non-failed node gets a response. Linearizability means operations appear to happen in one order that matches real time. A partitioned minority that still answers writes cannot promise that order.',
      'These definitions are easy to blur in marketing. A system can be highly available in normal times and still refuse writes on the minority side during a partition.',
      'If both sides of a partition accept the same bank withdrawal, the account can be overdrawn. Refusing the minority side prevents that and makes some requests fail until the partition heals.',
      'What log property must a new Raft leader have? Why is answering every request during a partition incompatible with one real-time order?',
      'Quoting CAP as a reason to skip replication. Replication and consensus are how you keep a consistent majority. CAP describes the requests you must refuse or the disagreements you must allow when the network splits.'
    ),
  },
  {
    names: ['kubernetes internal control plane architecture'],
    tier1: note(
      'Kubernetes runs containerized applications across machines. The control plane decides what should run. The worker nodes actually run it. You describe the desired state, and controllers try to make the cluster match that description.',
      'This separates I want three copies from the work of starting and restarting those copies.',
      'If you ask for three copies of a service and one dies, a controller starts another so the count returns to three.',
      'What do you declare to Kubernetes? What acts when a copy dies?',
      'Thinking the control plane is the application itself. It manages the application. The application runs in pods on worker nodes.'
    ),
    tier3: note(
      'The API server is the front door. Desired state is stored in etcd. Controllers watch that state and take action. The scheduler chooses a node for a new pod. On each node, the kubelet starts and watches the pods assigned there, and the container runtime runs the containers. A Service gives a stable way to reach a changing set of pods.',
      'The control loop is the design. The system repeatedly compares desired state with actual state instead of running a single script.',
      'A Deployment that asks for three replicas stores that number through the API server. If a node disappears, the controller observes two ready pods and creates a replacement, which the scheduler places.',
      'Where is the desired state stored? What is the kubelet job?',
      'Editing a running container and expecting that change to be the new desired state. The declared specification is what the controllers restore.'
    ),
    tier5: note(
      'etcd is a consensus-backed store. Losing etcd quorum means the control plane cannot safely accept new desired state. The API server authorizes requests and is the only normal writer. Controllers should be level-based: they react to the current spec and status, not only to a one-time event, so a missed event can be repaired on the next pass. The scheduler decision is a placement choice. It does not itself start the container. That is the kubelet and the runtime.',
      'Understanding the split explains outages. An application can be healthy on its nodes while the control plane cannot schedule anything new because etcd has no quorum.',
      'During an etcd quorum loss, existing pods can keep serving. New deployments and reschedules stall because the desired state cannot be updated safely.',
      'What fails when etcd loses quorum, and what can keep running? Why should a controller read current state instead of trusting one event?',
      'Treating the scheduler, kubelet, and API server as one process. A bug or outage in one of them has a different symptom.'
    ),
  },
  {
    names: ['distributed event streaming and lsm trees'],
    tier1: note(
      'An event stream is an ordered log of things that happened. Consumers read that log. An LSM tree is a way to store data that writes quickly by appending, then tidies the data in the background.',
      'A log lets several services react to the same event. An LSM store fits heavy write traffic.',
      'A payment event can be appended once. The email service and the ledger service both read it. A write goes to memory first and is flushed to disk as a sorted file.',
      'What do consumers read? Why can an LSM store accept writes quickly?',
      'Thinking a stream is a queue that forgets the event after one reader. A log can be reread by other consumers.'
    ),
    tier3: note(
      'In a log such as a Kafka topic, producers append records and consumers track how far they have read. Retention keeps the records for a time, so a new consumer can replay. An LSM tree writes to an in-memory table and a write-ahead log, then flushes sorted runs to disk. A read may check memory and several runs. Compaction merges runs and drops outdated values.',
      'Appending is cheap. Finding the latest value later costs a search across runs unless compaction and indexes, such as bloom filters, limit that work.',
      'Updating a user name does not rewrite one old disk page in place. It writes a newer version. A read must find the newest version. Compaction later drops the old one.',
      'How is a stream replay possible? What does LSM compaction remove?',
      'Assuming every read is as cheap as the write. The write is an append. The read may look through multiple sorted runs.'
    ),
    tier5: note(
      'A consumer offset is the position in the log, not a lock on the record. Two consumer groups can read the same topic independently. Compaction has two different meanings here: log compaction can keep the latest record per key, and LSM compaction merges sorted files. A bloom filter can say a key is definitely absent from a run, which avoids disk reads. It cannot, by itself, return the value.',
      'These systems trade read amplification and space for write throughput. That trade should be stated, not hidden.',
      'A key that was just updated may live in the memory table while older copies remain in two runs. The read returns the memory copy because it is newer. After compaction, the old copies can be gone.',
      'What does a bloom filter prove, and what does it not return? How is a consumer offset different from removing the event?',
      'Describing LSM writes as in-place updates. The usual path is a new version plus later cleanup.'
    ),
  },
  {
    names: ['applied cryptography and primitives'],
    tier1: note(
      'Encryption hides a message so only someone with the right key can read it. A hash is a fixed-length fingerprint of data. A signature shows who produced a message and whether it was changed.',
      'These are different jobs. Hiding is not the same as detecting a change, and a fingerprint is not encryption.',
      'A password should be stored as a slow hash, not as the password itself. A signed software update lets you check that it came from the publisher and was not altered.',
      'Can you recover the original message from a hash? What does a signature let you check?',
      'Using encryption alone and calling the result proof of who sent it. Encryption hides. A signature is what identifies the sender and detects changes.'
    ),
    tier3: note(
      'Symmetric encryption uses one shared key. Asymmetric encryption uses a public key and a private key. A cryptographic hash is one-way and collision-resistant for a sound algorithm: you cannot practically find a different input with the same hash. A MAC uses a shared key to detect changes. A digital signature uses a private key so anyone with the public key can verify. Passwords are stored with a slow password hash and a salt, not with a fast hash alone.',
      'Choosing the wrong primitive breaks the goal even if the algorithm is famous.',
      'HTTPS uses asymmetric keys to set up a session and then symmetric encryption for the data, because symmetric encryption is faster for bulk bytes. The server certificate is a signed statement of the public key.',
      'Why is a fast hash a poor way to store passwords? What is the difference between a MAC and a signature?',
      'Writing your own cipher or using ECB mode for pictures and structured data. ECB encrypts equal blocks to equal ciphertext and leaks patterns.'
    ),
    tier5: note(
      'Confidentiality, integrity, and authenticity are separate. Authenticated encryption, such as AES-GCM, provides confidentiality and integrity together when used with a unique nonce. Reusing a nonce in AES-GCM is a serious failure. A hash collision attack is not the same as reversing a hash. Certificates chain signatures back to a trusted root. A valid signature still says nothing about whether the signed contents are true, only that the key holder signed those bytes.',
      'Most real failures are key reuse, missing authentication, or trusting the wrong key, not a broken standard algorithm.',
      'Two AES-GCM messages under the same key and nonce can leak the XOR of the plaintexts and can break the authentication guarantee. A unique nonce per message is part of correct use.',
      'What fails if an AES-GCM nonce is reused? Does a valid signature prove that the message is true?',
      'Rolling a custom MAC by hashing key + message without the specified construction. Use the published construction. Order and key placement matter.'
    ),
  },
  {
    names: ['web security identity and oauth2 architecture'],
    tier1: note(
      'Identity answers who the user is. Authentication checks that claim. Authorization decides what that user may do. OAuth 2.0 is a way for an app to receive limited access without taking the user password.',
      'A site should not collect a password for a different site. It should ask that site to approve a limited token.',
      'A sign in with a provider button sends you to that provider. You approve access. The app receives a token, not your password.',
      'What does the app receive instead of your password? What is the difference between who you are and what you may do?',
      'Giving an app your password so it can act as you. That gives away every permission, not a limited one.'
    ),
    tier3: note(
      'OAuth 2.0 has a resource owner, a client app, an authorization server, and a resource server. The authorization code flow sends the user to the authorization server, returns a short-lived code to the client, and the client exchanges that code for tokens. Access tokens are presented to the API. Refresh tokens request new access tokens. OpenID Connect adds an ID token about the user authentication. A session cookie is a separate mechanism for the app own login.',
      'The code exchange is there so the access token is not left in the browser address bar.',
      'A web server app receives the code on a registered redirect URL, then exchanges it using a client secret kept on the server. The API later accepts the access token and ignores any request without the right scope.',
      'Why is the authorization code exchanged on the server? What is a scope?',
      'Putting a client secret in a public mobile app or browser script. Anyone can extract it. Public clients use the protections designed for them, including PKCE.'
    ),
    tier5: note(
      'The authorization code flow with PKCE protects public clients: the client sends a challenge, then proves it has the original verifier when redeeming the code. The redirect URI must match a registered value so a code is not sent to an attacker site. State, or an equivalent, binds the response to the request the user started. An access token is a capability for the scopes it names. It is not a proof of identity unless an ID token or user-info check is added. Tokens should be short-lived, sent only over TLS, and stored away from logs and URLs.',
      'Most OAuth failures are redirect mixups, tokens in URLs, missing state, or treating an access token as a login.',
      'If a redirect URI accepts any subdomain, an attacker site on a subdomain can receive the code. Registration has to be exact enough to prevent that.',
      'What does PKCE prove? Why is an access token not automatically a login?',
      'Inventing a flow that puts the long-lived token in a query string. Query strings leak into history, logs, and referrers.'
    ),
  },
  {
    names: ['systems and memory exploitation defenses'],
    tier1: note(
      'A memory bug lets a program write or read outside the area it was given. An attacker can use that to change what the program does next. Defenses make that harder: they stop code from running on the stack, choose random addresses, and check that a return address was not replaced.',
      'These defenses are ordinary compiler and operating-system protections. They are not a reason to ignore safe coding.',
      'A too-long input that spills past a buffer can overwrite a return address. A stack canary is a value placed before that address and checked before the function returns.',
      'What does a buffer overflow overwrite if it goes far enough? What does a stack canary check?',
      'Saying a language with these defenses cannot be exploited. The defenses raise the cost. A bug can still be enough.'
    ),
    tier3: note(
      'A stack buffer overflow can overwrite saved data and the return address. NX or DEP marks the stack non-executable so injected bytes are not run as code. ASLR randomizes where code and libraries are loaded so a hardcoded address is less likely to be right. A stack canary detects a smash before return. PIE randomizes the program itself. These are layered because each stops a different trick.',
      'Return-oriented programming exists because NX blocked injected code. The attacker chains existing instructions. ASLR and canaries are part of the response to that, not a complete end.',
      'If the stack cannot be executed, a payload of machine code placed in a buffer does not run. The attacker instead needs a useful address already in the program, which ASLR makes harder to guess.',
      'What does NX prevent? What attack does that limitation encourage, and what does ASLR change about it?',
      'Disabling ASLR and canaries in production because they complicate debugging. Those are release defenses, not optional style.'
    ),
    tier5: note(
      'A canary does not stop an overflow that only changes a nearby variable and never reaches the canary. ASLR is weaker if a leak reveals an address, because other addresses may then be computed. RELRO reduces writable global redirection points. Control-flow integrity and shadow stacks check that returns and calls go to expected targets. None of these replace memory-safe languages or bounds checks. They reduce the value of the bugs that remain.',
      'Defense in depth means one leaked address or one missed check should not equal full control.',
      'An overflow that changes a length field or a function pointer before the canary can still change behavior. The canary only sees the smash if the write reaches it.',
      'What class of overflow does a canary miss? Why does one leaked code address weaken ASLR?',
      'Listing ASLR as proof that exploits are obsolete. A leak plus a bug is a known pattern, which is why further checks exist.'
    ),
  },
  {
    names: ['stock market mechanics and equities'],
    tier1: note(
      'A share is a piece of ownership in a company. A stock exchange matches people who want to buy with people who want to sell. The price is the latest price they agreed.',
      'Owning a share means you own part of the company, not a guaranteed payment. The price can fall.',
      'If buyers will pay 100 and sellers will accept 100, a trade happens at 100. If nobody will sell that low, the next trade can be higher.',
      'What does a share represent? Who sets the price?',
      'Thinking the company sets the daily price, or that a share must return to what you paid. The next buyer and seller set the next price.'
    ),
    tier3: note(
      'An equity is common stock. A bid is the highest current buy offer. An ask is the lowest current sell offer. A trade prints when an order crosses that gap. Market orders accept the current other side. Limit orders wait for a stated price and may not trade. A dividend is a payment a company chooses to make from profits. It is not owed on a fixed schedule the way a bond coupon is. An index such as a market index is a calculated basket, not a company.',
      'The mechanics stop a student from confusing an order, a trade, and the value of the business.',
      'A limit buy at 90 does nothing while the ask is 95. It trades only if a seller meets 90 or better. The company does not receive that money unless the trade is in a new issue. Most trades are between existing owners.',
      'What is the difference between a bid and an ask? Does a normal trade on an exchange send money to the company?',
      'Saying a falling price means the company pays you back the loss. The loss is the change in what another buyer will pay.'
    ),
    tier5: note(
      'Primary markets raise money for the issuer, as in an IPO. Secondary markets trade existing shares and do not fund the company on each trade. Market makers quote bids and asks and earn the spread in return for standing ready. Volatility is how much the price moves. It is not the same as a permanent loss. A diversified index fund holds many companies so one failure is a fraction of the holding. Concentration in one share can go to zero if that company fails.',
      'Professional use of the market starts by naming which market, which order, and which risk.',
      'Buying in an IPO can send money to the company. Buying the same share the next day from another investor does not. The price can differ on those two days.',
      'How is a secondary-market trade different from an IPO for the company? What risk does holding one company add that a broad index reduces?',
      'Treating a historical average return as a promise for the next year. It is a description of the past, and the path includes large declines.'
    ),
  },
  {
    names: ['macroeconomics inflation and central banks'],
    tier1: note(
      'Inflation means prices in general are rising, so a unit of money buys less. A central bank influences how easy it is to borrow. Higher interest rates usually slow borrowing and spending. Lower rates usually encourage them.',
      'This is about the whole economy, not one shop raising one price.',
      'If a basket of ordinary goods costs more this year than last year, that rise is inflation. A central bank that raises its policy rate makes loans more expensive.',
      'What does inflation do to what money can buy? What does a higher policy rate do to borrowing?',
      'Calling one expensive product inflation. Inflation is a broad rise in prices, usually measured by a basket.'
    ),
    tier3: note(
      'A consumer price index tracks a basket of goods and services. The inflation rate is the percentage change in that index. A central bank policy rate influences other interest rates. Raising it tends to reduce borrowing and demand. Cutting it tends to support demand. Most modern central banks have a target inflation rate and adjust policy when inflation and employment are away from their goals. They do not set the price of each product.',
      'The distinction matters for saving and wages. A wage rise below inflation is a fall in what the wage buys.',
      'If the index rises from 100 to 105, inflation over that period is 5 percent. A savings account paying 2 percent then loses purchasing power.',
      'How is the inflation rate calculated from a price index? Does the central bank choose the price of bread?',
      'Treating a rate cut as free money with no later cost. Lower rates can support jobs and can also let inflation rise if demand outruns supply.'
    ),
    tier5: note(
      'Real interest rate is approximately the nominal rate minus expected inflation. A central bank that only looks at the nominal rate can be loose when inflation expectations rise. Policy works with lags: a rate change does not move every price next week. Supply shocks, such as an energy shortage, can raise prices even when demand is weak. The bank then faces a worse tradeoff, because fighting the price rise can weaken jobs.',
      'Professional discussion names the shock and the lag instead of promising one dial will fix both prices and employment immediately.',
      'If expected inflation rises from 2 percent to 6 percent and the policy rate stays at 3 percent, the real rate becomes negative and borrowing is encouraged even though prices are already rising.',
      'How do you estimate a real rate? Why can an energy shock put prices and jobs on opposite sides of the bank choice?',
      'Explaining every price rise as the central bank printing. Some rises are supply shocks, taxes, or a change in one scarce good.'
    ),
  },
  {
    names: ['personal wealth building and compounding'],
    tier1: note(
      'Compounding means you earn a return on the original money and also on the returns already earned. Saving a regular amount for a long time matters more than one dramatic bet.',
      'This is ordinary personal finance: spend less than you earn, keep an emergency reserve, and avoid high-interest debt.',
      '100 that grows at 10 percent becomes 110 after one year. The next year, 10 percent applies to 110, not only to the original 100.',
      'What is new in the second year of compounding? Why is a high-interest debt a problem?',
      'Expecting money to double every year. A typical saving rate is far smaller, and a high promised rate is a warning, not a plan.'
    ),
    tier3: note(
      'Compound growth is principal times (1 + rate) raised to the number of periods. A contribution added every year grows for fewer years than the first contribution. Paying off debt at 20 percent is a guaranteed 20 percent improvement and beats a risky investment you only hope will earn that much. An emergency fund is cash for a job loss or repair so you are not forced to sell investments or borrow at a high rate. Diversifying means not putting every saving into one asset.',
      'The order is practical: expensive debt, a cash reserve, then long-term investing.',
      'Someone who invests 100 a month for 30 years has put in 36,000. At a steady 7 percent annual return, the result is much larger than 36,000 because early contributions had decades to compound. The 7 percent is an assumption, not a promise.',
      'Why is the first contribution worth more than the last one? Why pay off expensive debt before chasing a risky return?',
      'Describing compounding as interest on interest without saying the rate can be negative. A falling market compounds losses too.'
    ),
    tier5: note(
      'The rule of 72 estimates doubling time as 72 divided by the annual percent rate. At 8 percent, doubling takes about 9 years. Fees compound as well: a 1 percent annual fee on a fund is a 1 percent drag every year. Inflation reduces what the final amount buys, so a plan should look at real growth. A concentrated bet can beat this math or wipe it out. The math describes a stated rate. It does not create the rate.',
      'Professional personal finance states the contribution, the fee, the inflation assumption, and the risk of not getting the assumed return.',
      'At 7 percent, money doubles in about 10 years by the rule of 72. A 1 percent fee makes the net rate closer to 6 percent, and the doubling time becomes about 12 years. Over several doublings, that gap is large.',
      'Estimate the doubling time at 6 percent. Why does a small annual fee matter more over 30 years than over 1 year?',
      'Using a past high return as the rate in the formula and treating the output as a forecast. The formula only repeats the rate you typed in.'
    ),
  },
  {
    names: ['ancient civilizations and foundations'],
    tier1: note(
      'An ancient civilization is a society with cities, shared rules, and a way to grow or trade food. Early examples include Mesopotamia, Egypt, the Indus Valley, and early China. They grew up near rivers that supplied water and soil.',
      'Rivers made farming reliable enough for people to live in one place and specialize in jobs other than finding food.',
      'Egypt used the Nile flood to water fields. Mesopotamia used the Tigris and Euphrates and built canals.',
      'Why did these societies grow beside rivers? Name two of them.',
      'Treating every ancient society as the same, or as a myth. They had different writing, laws, and gods, and we know them from remains and texts, which are incomplete.'
    ),
    tier3: note(
      'Farming surplus supported people who were not farmers: officials, craft workers, and soldiers. Writing began as a way to record goods and laws. Mesopotamia used cuneiform. Egypt used hieroglyphs. Cities needed rules for land, water, and trade. A state is that lasting organization, not just a crowd of people.',
      'The useful study is what problem the institution solved: food, water, records, and authority.',
      'A Mesopotamian temple or palace storehouse tracked grain. The writing is evidence of administration, not only of literature. Egyptian pyramids are evidence of a state that could organize labor over years, not only of a belief about death.',
      'What did early writing record besides stories? What does a monument imply about organization?',
      'Explaining a civilization by one king or one wonder. The farming surplus and the record-keeping are what made the lasting structure possible.'
    ),
    tier5: note(
      'Sources are uneven. Stone and dry tombs survive. Wooden houses and ordinary records often do not. Absence of a surviving text is not proof that a practice did not exist. Dating uses archaeology, inscriptions, and later historians, who had their own audiences. Comparing Egypt and Mesopotamia shows two responses to river farming: one relatively unified along one river, and one of competing cities between two rivers.',
      'A careful claim says what the evidence is. A story that fills every gap is not history.',
      'We can say Egyptian officials recorded grain and labor because administrative texts survive. We should not invent the feelings of an unnamed worker when no source says them.',
      'Why is surviving evidence biased toward stone and official writing? What is the difference between a sourced claim and a gap filled with a story?',
      'Using a modern country as if it were the ancient state. Ancient Egypt and modern Egypt are not the same political unit.'
    ),
  },
  {
    names: ['philosophy and cognitive mental models'],
    tier1: note(
      'Philosophy asks what a claim means and what would show it is true or fair. A mental model is a simple picture you use to think. A good model matches the situation. A bad one is only a slogan.',
      'The point is to notice the reason, not to collect quotes.',
      'If someone says this is natural, a careful question is: natural in what sense, and why should that decide what we ought to do? The word moved from a description to a recommendation.',
      'What question do you ask when a word is doing two jobs? What is a mental model for?',
      'Treating a famous sentence as an argument. The argument is the reason, and it can be weak even if the speaker is famous.'
    ),
    tier3: note(
      'An argument has a conclusion and reasons. It is valid when the conclusion follows from the reasons. It is sound when it is valid and the reasons are true. A thought experiment tests a principle by a clear case. Stoic practice separates what you can change from what you cannot, which is a mental model for action, not a proof about physics. Cognitive shortcuts, such as judging a claim by how easily an example comes to mind, are availability bias.',
      'Naming the move lets you slow down. You can accept the fact and still reject the leap.',
      'A news story that is easy to remember can make a rare event feel common. That is availability, not a count of how often the event happens.',
      'What is the difference between a valid argument and a sound one? Give one example of availability bias.',
      'Using a model outside the case it was built for. A useful rule of thumb is not a universal law.'
    ),
    tier5: note(
      'Equivocation uses one word in two senses inside one argument. The move from is to ought needs a value premise. It is not supplied by the fact alone. A mental model should state its assumptions and its failure. Confirmation bias keeps the examples that fit and forgets the rest. The correction is to ask what evidence would count against the view, and to look for it.',
      'Professional thinking writes the principle, the case, and the reason the case might not apply.',
      'People are often selfish is a descriptive claim. Therefore we should design only for selfishness adds a value claim about what we should do. The second sentence is not proved by the first.',
      'What extra premise is needed to move from a fact to a recommendation? What evidence would count against your current view?',
      'Collecting biases as insults. A bias is a described error. Naming it is useful only if it changes what evidence you accept.'
    ),
  },
  {
    names: ['music theory and visual arts evolution'],
    tier1: note(
      'Music theory names pitch, rhythm, and harmony so people can describe what they hear. Visual art history names how pictures and sculpture changed as materials, patrons, and ideas changed.',
      'Names let you point at a specific choice instead of saying only that something is nice.',
      'A major chord and a minor chord use different sets of notes, and listeners often hear them as different moods. A painted shadow can show where the artist wanted the light to come from.',
      'What does a chord name describe? What can a shadow in a painting show?',
      'Treating theory as a law that forbids sounds. Theory describes patterns. Music can break a pattern on purpose.'
    ),
    tier3: note(
      'In common Western practice, a scale is a chosen set of pitches, and a chord is pitches sounded together. Rhythm is how sounds are placed in time. A cadence is a harmonic close. In visual art, composition is the arrangement, perspective is a method for depth, and a movement such as Impressionism is a historical grouping, not a single style with one rule. Impressionists often studied outdoor light. Cubism, associated with Picasso and Braque, showed more than one view of an object.',
      'The history is a sequence of problems artists took up. It is not a ladder from worse to better.',
      'Monet painted the same cathedral front at different times of day to study light. That is a different aim from a Cubist painting that breaks the object into geometric views.',
      'What is a scale? What problem was a Monet series of one facade studying? Did later art replace earlier art as the correct kind?',
      'Saying there is one correct period. A Gregorian chant, a classical symphony, and a jazz rhythm are different practices with different goals.'
    ),
    tier5: note(
      'Functional harmony in the common-practice period treats a tonic chord as home and a dominant chord as tension that tends to resolve. That description fits a large body of European music from roughly the seventeenth to the nineteenth century. It is a poor description of a raga, a blues scale used in its own way, or much twentieth-century music that avoids that pull. In art history, a movement label is given by later writers as well as by the artists. One painting can sit poorly inside the label.',
      'Use the term for the tradition it belongs to, and say when it does not apply.',
      'A dominant-to-tonic ending is a real cadence in a Mozart phrase. Calling every strong ending in every culture a dominant-to-tonic cadence imports a European rule that the music may not use.',
      'Where does tonic and dominant harmony apply cleanly? Why can a movement label be too broad for one artwork?',
      'Ranking cultures on a single timeline from primitive to advanced. Different traditions solve different musical and visual problems.'
    ),
  },
];

export function authoredLesson(topic, tier = 'tier3') {
  const key = normalize(topic);
  if (!key) return null;
  const course = COURSES.find((item) => item.names.includes(key))
    || COURSES.find((item) => item.names.some((name) => name.length >= 12 && (key.includes(name) || name.includes(key))));
  if (!course) return null;
  return course[tier] || course.tier3;
}
