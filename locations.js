const locationData = {
    "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Rajahmundry", "Tirupati", "Anantapur", "Kadapa", "Kakinada"],
    "Arunachal Pradesh": ["Itanagar", "Naharlagun", "Pasighat", "Roing", "Tezu", "Ziro", "Bomdila", "Khonsa", "Along", "Tawang"],
    "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tinsukia", "Tezpur", "Bongaigaon", "Dhubri", "Diphu"],
    "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Darbhanga", "Bihar Sharif", "Arrah", "Begusarai", "Katihar"],
    "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Korba", "Rajnandgaon", "Raigarh", "Jagdalpur", "Ambikapur", "Dhamtari", "Mahasamund"],
    "Goa": ["Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda", "Bicholim", "Curchorem", "Cuncolim", "Valpoi", "Canacona"],
    "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Junagadh", "Gandhinagar", "Gandhidham", "Anand", "Navsari", "Morbi", "Nadiad", "Bharuch", "Mehsana", "Bhuj", "Porbandar", "Palanpur", "Valsad", "Vapi"],
    "Haryana": ["Faridabad", "Gurugram", "Panipat", "Ambala", "Yamunanagar", "Rohtak", "Hisar", "Karnal", "Sonipat", "Panchkula"],
    "Himachal Pradesh": ["Shimla", "Dharamshala", "Solan", "Mandi", "Palampur", "Baddi", "Nahan", "Paonta Sahib", "Sundernagar", "Chamba"],
    "Jharkhand": ["Jamshedpur", "Dhanbad", "Ranchi", "Bokaro Steel City", "Deoghar", "Phusro", "Hazaribagh", "Giridih", "Ramgarh", "Medininagar"],
    "Karnataka": ["Bengaluru", "Hubballi-Dharwad", "Mysuru", "Kalaburagi", "Mangaluru", "Belagavi", "Davanagere", "Ballari", "Vijayapura", "Shivamogga"],
    "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Kollam", "Thrissur", "Alappuzha", "Palakkad", "Malappuram", "Punnapra", "Thalassery"],
    "Madhya Pradesh": ["Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Dewas", "Satna", "Ratlam", "Rewa"],
    "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Pimpri-Chinchwad", "Nashik", "Kalyan-Dombivli", "Vasai-Virar", "Aurangabad", "Navi Mumbai", "Solapur", "Mira-Bhayandar", "Bhiwandi", "Amravati", "Nanded", "Kolhapur", "Akola", "Ulhasnagar", "Sangli", "Malegaon"],
    "Manipur": ["Imphal", "Thoubal", "Lilong", "Mayang Imphal", "Nambol", "Moirang", "Kakching", "Wangjing", "Yairipok", "Bishnupur"],
    "Meghalaya": ["Shillong", "Tura", "Nongstoin", "Jowai", "Baghmara", "Williamnagar", "Nongpoh", "Resubelpara", "Mairang", "Cherrapunji"],
    "Mizoram": ["Aizawl", "Lunglei", "Saiha", "Champhai", "Kolasib", "Serchhip", "Lawngtlai", "Mamit", "Saitual", "Khawzawl"],
    "Nagaland": ["Dimapur", "Kohima", "Tuensang", "Mokokchung", "Wokha", "Zunheboto", "Phek", "Chümoukedima", "Mon", "Kiphire"],
    "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "Puri", "Balasore", "Bhadrak", "Baripada", "Jharsuguda"],
    "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali", "Hoshiarpur", "Batala", "Pathankot", "Moga"],
    "Rajasthan": ["Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer", "Udaipur", "Bhilwara", "Alwar", "Bharatpur", "Sikar"],
    "Sikkim": ["Gangtok", "Namchi", "Gyalshing", "Mangan", "Singtam", "Rangpo", "Nayabazar", "Jorethang", "Ravangla", "Soreng"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Tiruppur", "Ambattur", "Erode", "Vellore"],
    "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Khammam", "Karimnagar", "Ramagundam", "Mahbubnagar", "Nalgonda", "Adilabad", "Suryapet"],
    "Tripura": ["Agartala", "Dharmanagar", "Kailasahar", "Udaipur", "Ambassa", "Belonia", "Khowai", "Ranirbazar", "Santirbazar", "Teliamura"],
    "Uttar Pradesh": ["Lucknow", "Kanpur", "Ghaziabad", "Agra", "Meerut", "Varanasi", "Prayagraj", "Bareilly", "Aligarh", "Moradabad", "Noida", "Firozabad", "Jhansi", "Gorakhpur", "Saharanpur"],
    "Uttarakhand": ["Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rudrapur", "Kashipur", "Rishikesh", "Pithoragarh", "Ramnagar", "Manglaur"],
    "West Bengal": ["Kolkata", "Howrah", "Asansol", "Siliguri", "Durgapur", "Maheshtala", "Rajpur Sonarpur", "Gopalpur", "Bhatpara", "Panihati"],
    "Andaman and Nicobar Islands": ["Port Blair"],
    "Chandigarh": ["Chandigarh"],
    "Dadra and Nagar Haveli and Daman and Diu": ["Daman", "Diu", "Silvassa"],
    "Delhi": ["New Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi"],
    "Jammu and Kashmir": ["Srinagar", "Jammu", "Anantnag", "Baramulla", "Kathua", "Sopore", "Udhampur", "Samba", "Rajouri", "Poonch"],
    "Ladakh": ["Leh", "Kargil"],
    "Lakshadweep": ["Kavaratti", "Agatti", "Amini", "Andrott", "Bitra", "Chetlat", "Kadmat", "Kalpeni", "Kiltan", "Minicoy"],
    "Puducherry": ["Puducherry", "Karaikal", "Mahe", "Yanam"]
};

/**
 * Initialize location dropdowns
 * @param {string} stateId - ID of the state select element
 * @param {string} cityId - ID of the city select element
 * @param {string} currentState - (Optional) Current selected state
 * @param {string} currentCity - (Optional) Current selected city
 */
function initLocationDropdowns(stateId, cityId, currentState = '', currentCity = '') {
    console.log(`[Locations] Initializing dropdowns: ${stateId}, ${cityId}`);
    const stateSelect = document.getElementById(stateId);
    const citySelect = document.getElementById(cityId);

    if (!stateSelect || !citySelect) {
        console.warn(`[Locations] Dropdown elements not found: ${stateId}, ${cityId}`);
        return;
    }

    // Clean initial values
    currentState = currentState ? currentState.trim() : '';
    currentCity = currentCity ? currentCity.trim() : '';

    // Reset dropdowns
    stateSelect.innerHTML = '<option value="">Select State</option>';
    citySelect.innerHTML = '<option value="">Select City</option>';
    citySelect.disabled = true;

    // Populate states
    const states = Object.keys(locationData).sort();
    states.forEach(state => {
        const option = document.createElement('option');
        option.value = state;
        option.textContent = state;
        // Use a more flexible matching for initial selection
        if (currentState && state.toLowerCase() === currentState.toLowerCase()) {
            option.selected = true;
            currentState = state; // Standardize to our key
        }
        stateSelect.appendChild(option);
    });

    // Populate cities based on state
    const populateCities = (state, selectedCity = '') => {
        citySelect.innerHTML = '<option value="">Select City</option>';
        if (state && locationData[state]) {
            citySelect.disabled = false;
            const cities = locationData[state].sort();
            cities.forEach(city => {
                const option = document.createElement('option');
                option.value = city;
                option.textContent = city;
                if (selectedCity && city.toLowerCase() === selectedCity.toLowerCase()) {
                    option.selected = true;
                }
                citySelect.appendChild(option);
            });
        } else {
            citySelect.disabled = true;
        }
    };

    // Handle state change
    stateSelect.addEventListener('change', (e) => {
        populateCities(e.target.value);
    });

    // Initial population if state is provided
    if (currentState && locationData[currentState]) {
        populateCities(currentState, currentCity);
    }
}

console.log('[Locations] Module loaded');
