// تایپینگ افکت
function initTypingEffect() {
    const bioElement = document.getElementById('bio');
    if (!bioElement) return;

    const originalBio = bioElement.textContent;
    bioElement.textContent = '';
    
    let i = 0;
    const typingEffect = setInterval(() => {
        if (i < originalBio.length) {
            bioElement.textContent += originalBio.charAt(i);
            i++;
        } else {
            clearInterval(typingEffect);
        }
    }, 50);
}

// مدیریت تم تاریک/روشن
const themeToggle = document.getElementById('theme-toggle');
const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

const currentTheme = localStorage.getItem('theme') || 
                   (prefersDarkScheme.matches ? 'dark' : 'light');

if (currentTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
} else {
    document.documentElement.removeAttribute('data-theme');
    themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
}

themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    if (currentTheme === 'dark') {
        document.documentElement.removeAttribute('data-theme');
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        localStorage.setItem('theme', 'light');
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        localStorage.setItem('theme', 'dark');
    }
});

// توابع API
async function callApi(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(`http://localhost:3001/api/${endpoint}`, options);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'خطا در ارتباط با سرور');
        }
        
        return await response.json();
    } catch (error) {
        console.error('خطای کامل:', error);
        throw error;
    }
}

// پر کردن تمام بخش‌های رزومه
async function populateResumeFromAPI() {
    try {
        const data = await callApi('resume');
        
        // پر کردن اطلاعات شخصی
        document.getElementById('full-name').textContent = data.personal_info?.name || 'نام نامشخص';
        document.getElementById('job-title').textContent = data.personal_info?.job_title || 'عنوان شغلی نامشخص';
        document.getElementById('profile-pic').src = data.personal_info?.profile_pic || '';
        document.getElementById('profile-pic').alt = `عکس ${data.personal_info?.name || 'پروفایل'}`;
        document.getElementById('bio').textContent = data.personal_info?.bio || '';
        document.getElementById('footer-name').textContent = data.personal_info?.name || 'پارسا پولادوند';

        // پر کردن مهارت‌ها
        const skillsList = document.getElementById('skills-list');
        if (skillsList) {
            skillsList.innerHTML = (data.skills || []).map(skill => `
                <div class="skill-item">
                    <div class="skill-name">
                        <span>${skill.name}</span>
                        <span>${skill.level}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress" style="width: ${skill.level}"></div>
                    </div>
                </div>
            `).join('') || '<p>مهارتی یافت نشد</p>';
        }

        // پر کردن تحصیلات
        const educationList = document.getElementById('education-list');
        if (educationList) {
            educationList.innerHTML = (data.education || []).map(edu => `
                <div class="timeline-item">
                    <h3>${edu.institution}</h3>
                    <span class="timeline-date">${edu.start_year} - ${edu.end_year || 'اکنون'}</span>
                    <p>${edu.degree} - ${edu.description}</p>
                </div>
            `).join('') || '<p>سابقه تحصیلی یافت نشد</p>';
        }

        // پر کردن تجربه‌ها
        const experienceList = document.getElementById('experience-list');
        if (experienceList) {
            experienceList.innerHTML = (data.experience || []).map(exp => `
                <div class="timeline-item">
                    <h3>${exp.company}</h3>
                    <span class="timeline-date">${exp.start_date} - ${exp.end_date || 'اکنون'}</span>
                    <p>${exp.position} - ${exp.description}</p>
                </div>
            `).join('') || '<p>سابقه کاری یافت نشد</p>';
        }

        // پر کردن علاقه‌مندی‌ها
        const interestsList = document.getElementById('interests-list');
        if (interestsList) {
            interestsList.innerHTML = (data.interests || []).map(interest => `
                <li>${interest}</li>
            `).join('') || '<p>علاقه‌مندی‌ای یافت نشد</p>';
        }

        // پر کردن اطلاعات تماس
        const contactList = document.getElementById('contact-list');
        if (contactList && data.personal_info?.contact) {
            const contact = data.personal_info.contact;
            contactList.innerHTML = `
                ${contact.email ? `<li><i class="fas fa-envelope"></i> <a href="${contact.email}">ایمیل</a></li>` : ''}
                ${contact.phone ? `<li><i class="fas fa-phone"></i> <a href="${contact.phone}">تماس</a></li>` : ''}
                ${contact.linkedin ? `<li><i class="fab fa-linkedin"></i> <a href="${contact.linkedin}" target="_blank">لینکدین</a></li>` : ''}
                ${contact.github ? `<li><i class="fab fa-github"></i> <a href="${contact.github}" target="_blank">گیت‌هاب</a></li>` : ''}
            `;
        }
    } catch (error) {
        document.getElementById('full-name').textContent = 'خطا در بارگذاری داده‌ها';
        console.error('خطا:', error);
    }
}

// مدیریت modal ویرایش
function initEditModal() {
    const modal = document.getElementById('edit-modal');
    const editBtn = document.getElementById('edit-resume');
    const closeBtn = document.querySelector('.close');
    const cancelBtn = document.getElementById('cancel-edit');
    const saveBtn = document.getElementById('save-changes');

    editBtn?.addEventListener('click', async () => {
        try {
            const data = await callApi('resume');
            document.getElementById('resume-json').value = JSON.stringify(data, null, 2);
            modal.style.display = 'block';
        } catch (error) {
            console.error('خطا در دریافت داده:', error);
            alert('خطا در دریافت داده‌ها');
        }
    });

    closeBtn?.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    cancelBtn?.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    saveBtn?.addEventListener('click', async () => {
        try {
            const newData = JSON.parse(document.getElementById('resume-json').value);
            await callApi('resume', 'PUT', newData);
            modal.style.display = 'none';
            alert('تغییرات با موفقیت ذخیره شد!');
            location.reload();
        } catch (error) {
            console.error('خطا در ذخیره تغییرات:', error);
            alert('خطا در ذخیره تغییرات: ' + error.message);
        }
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// مدیریت حذف بخش‌ها
function initDeleteButtons() {
    document.querySelectorAll('.delete-section').forEach(button => {
        button.addEventListener('click', async () => {
            const section = button.dataset.section;
            if (confirm(`آیا از حذف بخش "${section}" مطمئن هستید؟`)) {
                try {
                    await callApi(`resume/${section}`, 'DELETE');
                    alert('بخش با موفقیت حذف شد!');
                    location.reload();
                } catch (error) {
                    console.error('خطا در حذف بخش:', error);
                    alert('خطا در حذف بخش');
                }
            }
        });
    });
}

// فعال کردن انیمیشن‌ها
function initAnimations() {
    // اضافه کردن سال جاری به فوتر
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
}

// بارگذاری مجدد داده‌ها
function initRefreshButton() {
    document.getElementById('refresh-data')?.addEventListener('click', () => {
        location.reload();
    });
}

// اجرای توابع هنگام لود صفحه
document.addEventListener('DOMContentLoaded', () => {
    populateResumeFromAPI().then(() => {
        initTypingEffect();
        initAnimations();
    });
    
    initEditModal();
    initDeleteButtons();
    initRefreshButton();
});