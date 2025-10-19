import { apiService } from "../../../../assets/js/apiService.js";

const skillsList = [];
const selectedSkills = [];
const skillsInput = document.getElementById("skills-input");
const skillsTags = document.getElementById("skills-tags");
const skillsDropdown = document.getElementById("skills-dropdown");

function renderSkillsTags() {
  skillsTags.innerHTML = "";
  selectedSkills.forEach((skill) => {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = skill;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.innerHTML = "&times;";
    btn.onclick = () => removeSkill(skill);
    tag.appendChild(btn);
    skillsTags.appendChild(tag);
  });
}

function removeSkill(skill) {
  const idx = selectedSkills.indexOf(skill);
  if (idx > -1) {
    selectedSkills.splice(idx, 1);
    renderSkillsTags();
    renderDropdown();
  }
}

function addSkill(skill) {
  if (!selectedSkills.includes(skill)) {
    selectedSkills.push(skill);
    renderSkillsTags();
    renderDropdown();
    skillsInput.value = "";
  }
}

function renderDropdown() {
  const value = skillsInput.value.toLowerCase();
  const filtered = skillsList.filter(
    (skill) =>
      skill.toLowerCase().includes(value) && !selectedSkills.includes(skill)
  );
  if (filtered.length && value) {
    skillsDropdown.innerHTML = "";
    filtered.forEach((skill) => {
      const item = document.createElement("div");
      item.className = "dropdown-item";
      item.textContent = skill;
      item.onclick = () => addSkill(skill);
      skillsDropdown.appendChild(item);
    });
    skillsDropdown.classList.remove("hidden");
  } else {
    skillsDropdown.classList.add("hidden");
  }
}

skillsInput.addEventListener("input", renderDropdown);
skillsInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    e.preventDefault();
    const value = skillsInput.value.trim();
    if (
      value &&
      skillsList.includes(value) &&
      !selectedSkills.includes(value)
    ) {
      addSkill(value);
      skillsDropdown.classList.add("hidden");
    }
  }
});

document.addEventListener("click", function (e) {
  if (!skillsInput.contains(e.target) && !skillsDropdown.contains(e.target)) {
    skillsDropdown.classList.add("hidden");
  }
});

async function fillProjectTypes() {
  const select = document.querySelector("select");
  if (!select) return;
  select.innerHTML = '<option data-i18n="projects_form.select_type"></option>';
  try {
    const types = await apiService.getProjectTypes();
    types.forEach((type) => {
      if (type.active) {
        const option = document.createElement("option");
        option.value = type.id;
        option.textContent = type.name;
        select.appendChild(option);
      }
    });
  } catch (err) {
    console.error("Erro ao buscar tipos de projeto:", err);
  }
}

fillProjectTypes();
