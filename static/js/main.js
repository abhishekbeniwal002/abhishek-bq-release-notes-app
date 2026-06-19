document.addEventListener('DOMContentLoaded', () => {
    const refreshBtn = document.getElementById('refresh-btn');
    const spinnerIcon = document.getElementById('spinner-icon');
    const loader = document.getElementById('loader');
    const notesContainer = document.getElementById('notes-container');
    const errorContainer = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');

    // Fetch on initial load
    fetchNotes();

    refreshBtn.addEventListener('click', fetchNotes);

    async function fetchNotes() {
        setLoadingState(true);

        try {
            const response = await fetch('/api/notes');
            const data = await response.json();

            if (data.status === 'success') {
                renderNotes(data.data);
            } else {
                showError(data.message || 'Failed to fetch release notes.');
            }
        } catch (err) {
            showError('Network error or server unreachable.');
        } finally {
            setLoadingState(false);
        }
    }

    function setLoadingState(isLoading) {
        if (isLoading) {
            refreshBtn.disabled = true;
            spinnerIcon.classList.add('spin');
            notesContainer.classList.add('hidden');
            errorContainer.classList.add('hidden');
            loader.classList.remove('hidden');
        } else {
            refreshBtn.disabled = false;
            spinnerIcon.classList.remove('spin');
            loader.classList.add('hidden');
        }
    }

    function showError(message) {
        errorText.textContent = message;
        errorContainer.classList.remove('hidden');
        notesContainer.classList.add('hidden');
    }

    function renderNotes(notes) {
        notesContainer.innerHTML = '';
        
        if (!notes || notes.length === 0) {
            notesContainer.innerHTML = `
                <div class="note-card" style="text-align: center;">
                    <p>No release notes found.</p>
                </div>
            `;
            notesContainer.classList.remove('hidden');
            return;
        }

        notes.forEach((note, index) => {
            const dateObj = new Date(note.published);
            const dateString = dateObj.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            // Extract plain text for tweet (first 100 chars of title or content)
            const tmpDiv = document.createElement('div');
            tmpDiv.innerHTML = note.title;
            const plainTitle = tmpDiv.textContent || tmpDiv.innerText || '';
            
            // Generate Twitter URL
            const tweetText = encodeURIComponent(`Check out this BigQuery update: ${plainTitle}`);
            const tweetUrl = encodeURIComponent(note.link || 'https://cloud.google.com/bigquery/docs/release-notes');
            const twitterIntent = `https://twitter.com/intent/tweet?text=${tweetText}&url=${tweetUrl}&hashtags=BigQuery,GoogleCloud`;

            const card = document.createElement('div');
            card.className = 'note-card';
            card.style.animationDelay = `${index * 0.05}s`;

            card.innerHTML = `
                <div class="note-header">
                    <div>
                        <h2 class="note-title">${note.title}</h2>
                        <div class="note-date">
                            <i class="fa-regular fa-calendar"></i>
                            <span>${dateString !== 'Invalid Date' ? dateString : note.published}</span>
                        </div>
                    </div>
                    <a href="${twitterIntent}" target="_blank" rel="noopener noreferrer" class="btn btn-tweet" title="Share on X (Twitter)">
                        <i class="fa-brands fa-twitter"></i>
                        <span>Tweet</span>
                    </a>
                </div>
                <div class="note-content">
                    ${note.content}
                </div>
            `;

            notesContainer.appendChild(card);
        });

        notesContainer.classList.remove('hidden');
    }
});
