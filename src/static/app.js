document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  let messageTimeout;

  function showMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    clearTimeout(messageTimeout);
    messageTimeout = setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  async function fetchActivities() {
    const response = await fetch("/activities");
    if (!response.ok) {
      throw new Error("Failed to load activities");
    }

    const activities = await response.json();
    activitiesList.replaceChildren();
    while (activitySelect.options.length > 1) {
      activitySelect.remove(1);
    }

    Object.entries(activities).forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";

      const heading = document.createElement("h4");
      heading.textContent = name;
      activityCard.appendChild(heading);

      const description = document.createElement("p");
      description.textContent = details.description;
      activityCard.appendChild(description);

      const schedule = document.createElement("p");
      schedule.textContent = `Schedule: ${details.schedule}`;
      activityCard.appendChild(schedule);

      const spotsLeft = details.max_participants - details.participants.length;
      const availability = document.createElement("p");
      availability.textContent = `Availability: ${spotsLeft} spots left`;
      activityCard.appendChild(availability);

      const participantsHeading = document.createElement("h5");
      participantsHeading.textContent = "Participants";
      activityCard.appendChild(participantsHeading);

      const participantsList = document.createElement("ul");
      participantsList.className = "participants-list";
      if (details.participants.length === 0) {
        const emptyMessage = document.createElement("li");
        emptyMessage.className = "no-participants";
        emptyMessage.textContent = "No participants yet";
        participantsList.appendChild(emptyMessage);
      } else {
        details.participants.forEach((email) => {
          const participant = document.createElement("li");
          participant.className = "participant-item";

          const participantEmail = document.createElement("span");
          participantEmail.className = "participant-email";
          participantEmail.textContent = email;
          participant.appendChild(participantEmail);

          const removeButton = document.createElement("button");
          removeButton.type = "button";
          removeButton.className = "remove-participant";
          removeButton.textContent = "×";
          removeButton.title = `Unregister ${email}`;
          removeButton.setAttribute("aria-label", `Unregister ${email} from ${name}`);
          removeButton.dataset.activity = name;
          removeButton.dataset.email = email;
          participant.appendChild(removeButton);

          participantsList.appendChild(participant);
        });
      }
      activityCard.appendChild(participantsList);
      activitiesList.appendChild(activityCard);

      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });
  }

  async function refreshActivities() {
    try {
      await fetchActivities();
    } catch (error) {
      activitiesList.textContent = "Failed to load activities. Please try again later.";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        signupForm.reset();
        await refreshActivities();
        showMessage(result.message, "success");
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  activitiesList.addEventListener("click", async (event) => {
    const removeButton = event.target.closest(".remove-participant");
    if (!removeButton) {
      return;
    }

    removeButton.disabled = true;
    const { activity, email } = removeButton.dataset;
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );
      const result = await response.json();

      if (!response.ok) {
        showMessage(result.detail || "Unable to unregister student", "error");
        return;
      }

      await refreshActivities();
      showMessage(result.message, "success");
    } catch (error) {
      showMessage("Failed to unregister student. Please try again.", "error");
      console.error("Error unregistering student:", error);
    } finally {
      removeButton.disabled = false;
    }
  });

  refreshActivities();
});
