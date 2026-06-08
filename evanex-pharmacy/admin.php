<?php
/**
 * Evanex Pharmacy, Laboratory & Scan Center
 * Visual Content Editor (PHP/JSON Hybrid CMS)
 * Designed for non-technical users to edit website text and photos securely.
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

session_start();

$config_file = __DIR__ . '/data/config.php';
$content_file = __DIR__ . '/data/content.json';
$upload_dir = __DIR__ . '/images/uploads/';

// Ensure data folder exists
if (!is_dir(__DIR__ . '/data')) {
    mkdir(__DIR__ . '/data', 0755, true);
}
// Ensure upload folder exists
if (!is_dir($upload_dir)) {
    mkdir($upload_dir, 0755, true);
}

// Generate CSRF token if not set
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// 1. Setup Phase: Check if administrator password is set
$is_setup_needed = !file_exists($config_file);

if ($is_setup_needed) {
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'setup') {
        $password = $_POST['password'] ?? '';
        $confirm = $_POST['confirm_password'] ?? '';
        
        if (strlen($password) < 6) {
            $error = "Password must be at least 6 characters long.";
        } elseif ($password !== $confirm) {
            $error = "Passwords do not match.";
        } else {
            $hash = password_hash($password, PASSWORD_DEFAULT);
            $config_content = "<?php\n// Secure configuration file\n\$password_hash = " . var_export($hash, true) . ";\n";
            if (file_put_contents($config_file, $config_content)) {
                $_SESSION['logged_in'] = true;
                header('Location: admin.php?success=setup');
                exit;
            } else {
                $error = "Failed to write config file. Please check folder permissions for ./data/";
            }
        }
    }
} else {
    // Load config
    include $config_file;
}

// 2. Authentication Flow
$is_logged_in = isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true;

if (!$is_setup_needed && !$is_logged_in) {
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'login') {
        $password = $_POST['password'] ?? '';
        if (password_verify($password, $password_hash)) {
            $_SESSION['logged_in'] = true;
            header('Location: admin.php');
            exit;
        } else {
            $error = "Incorrect password.";
        }
    }
}

// 3. Logout Action
if (isset($_GET['action']) && $_GET['action'] === 'logout') {
    $_SESSION = array();
    session_destroy();
    header('Location: admin.php');
    exit;
}

// 4. Save Content Action (Must be logged in)
if ($is_logged_in && $_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'save') {
    // Validate CSRF
    if (!isset($_POST['csrf_token']) || $_POST['csrf_token'] !== $_SESSION['csrf_token']) {
        die("CSRF validation failed.");
    }

    // Load existing content
    $content = [];
    if (file_exists($content_file)) {
        $content = json_decode(file_get_contents($content_file), true);
    }

    // Helper to upload files safely
    $upload_file = function($input_name, $current_val) use ($upload_dir) {
        if (isset($_FILES[$input_name]) && $_FILES[$input_name]['error'] === UPLOAD_ERR_OK) {
            $tmp_name = $_FILES[$input_name]['tmp_name'];
            $orig_name = basename($_FILES[$input_name]['name']);
            $ext = strtolower(pathinfo($orig_name, PATHINFO_EXTENSION));
            
            $allowed_exts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
            if (in_array($ext, $allowed_exts)) {
                $new_filename = uniqid('upload_', true) . '.' . $ext;
                $dest = $upload_dir . $new_filename;
                if (move_uploaded_file($tmp_name, $dest)) {
                    return '/images/uploads/' . $new_filename;
                }
            }
        }
        return $current_val;
    };

    // Hero Section
    $content['hero']['badge'] = htmlspecialchars($_POST['hero_badge'] ?? '', ENT_QUOTES, 'UTF-8');
    $content['hero']['title'] = htmlspecialchars($_POST['hero_title'] ?? '', ENT_QUOTES, 'UTF-8');
    $content['hero']['description'] = htmlspecialchars($_POST['hero_description'] ?? '', ENT_QUOTES, 'UTF-8');
    $content['hero']['bgImage'] = $upload_file('hero_bgImage', $content['hero']['bgImage'] ?? '');

    // CEO Section
    $content['ceo']['name'] = htmlspecialchars($_POST['ceo_name'] ?? '', ENT_QUOTES, 'UTF-8');
    $content['ceo']['role'] = htmlspecialchars($_POST['ceo_role'] ?? '', ENT_QUOTES, 'UTF-8');
    $content['ceo']['quote'] = htmlspecialchars($_POST['ceo_quote'] ?? '', ENT_QUOTES, 'UTF-8');
    $content['ceo']['image'] = $upload_file('ceo_image', $content['ceo']['image'] ?? '');

    // Services Section
    // Pharmacy
    $content['services']['pharmacy']['title'] = htmlspecialchars($_POST['pharmacy_title'] ?? '', ENT_QUOTES, 'UTF-8');
    $content['services']['pharmacy']['description'] = htmlspecialchars($_POST['pharmacy_description'] ?? '', ENT_QUOTES, 'UTF-8');
    $content['services']['pharmacy']['image'] = $upload_file('pharmacy_image', $content['services']['pharmacy']['image'] ?? '');

    // Laboratory
    $content['services']['laboratory']['title'] = htmlspecialchars($_POST['laboratory_title'] ?? '', ENT_QUOTES, 'UTF-8');
    $content['services']['laboratory']['description'] = htmlspecialchars($_POST['laboratory_description'] ?? '', ENT_QUOTES, 'UTF-8');
    $content['services']['laboratory']['image'] = $upload_file('laboratory_image', $content['services']['laboratory']['image'] ?? '');

    // Scan Centre
    $content['services']['scanCentre']['title'] = htmlspecialchars($_POST['scanCentre_title'] ?? '', ENT_QUOTES, 'UTF-8');
    $content['services']['scanCentre']['description'] = htmlspecialchars($_POST['scanCentre_description'] ?? '', ENT_QUOTES, 'UTF-8');
    $content['services']['scanCentre']['image'] = $upload_file('scanCentre_image', $content['services']['scanCentre']['image'] ?? '');

    // Contact details
    $content['contact']['address'] = htmlspecialchars($_POST['contact_address'] ?? '', ENT_QUOTES, 'UTF-8');
    $content['contact']['phones'] = htmlspecialchars($_POST['contact_phones'] ?? '', ENT_QUOTES, 'UTF-8');
    $content['contact']['email'] = htmlspecialchars($_POST['contact_email'] ?? '', ENT_QUOTES, 'UTF-8');
    $content['contact']['hours'] = htmlspecialchars($_POST['contact_hours'] ?? '', ENT_QUOTES, 'UTF-8');

    // News Articles (parsed from JSON string sent from dynamic JS list editor)
    if (isset($_POST['news_json'])) {
        $news_arr = json_decode($_POST['news_json'], true);
        if (is_array($news_arr)) {
            $content['news'] = [];
            foreach ($news_arr as $art) {
                $content['news'][] = [
                    'date' => htmlspecialchars($art['date'] ?? '', ENT_QUOTES, 'UTF-8'),
                    'tag' => htmlspecialchars($art['tag'] ?? '', ENT_QUOTES, 'UTF-8'),
                    'title' => htmlspecialchars($art['title'] ?? '', ENT_QUOTES, 'UTF-8'),
                    'desc' => htmlspecialchars($art['desc'] ?? '', ENT_QUOTES, 'UTF-8'),
                    'icon' => htmlspecialchars($art['icon'] ?? '', ENT_QUOTES, 'UTF-8')
                ];
            }
        }
    }

    // Save back to content.json
    if (file_put_contents($content_file, json_encode($content, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES))) {
        header('Location: admin.php?success=save');
        exit;
    } else {
        $error = "Failed to write updates to content.json. Check file write permissions.";
    }
}

// 5. Load Active Content for Dashboard
$content = [];
if (file_exists($content_file)) {
    $content = json_decode(file_get_contents($content_file), true);
} else {
    // Provide a structure if not exists
    $content = [
        'hero' => ['badge' => '', 'title' => '', 'description' => '', 'bgImage' => ''],
        'ceo' => ['name' => '', 'role' => '', 'quote' => '', 'image' => ''],
        'services' => [
            'pharmacy' => ['title' => '', 'description' => '', 'image' => ''],
            'laboratory' => ['title' => '', 'description' => '', 'image' => ''],
            'scanCentre' => ['title' => '', 'description' => '', 'image' => '']
        ],
        'contact' => ['address' => '', 'phones' => '', 'email' => '', 'hours' => ''],
        'news' => []
    ];
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Evanex Website Content Management System</title>
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800&display=swap" rel="stylesheet">
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Outfit', 'sans-serif'],
                    }
                }
            }
        }
    </script>
    <style>
        .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(15, 23, 42, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(13, 148, 136, 0.3);
            border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(13, 148, 136, 0.6);
        }
    </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen font-sans selection:bg-teal-500 selection:text-white flex flex-col">

    <!-- Header / Nav -->
    <header class="border-b border-slate-900 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center font-extrabold text-white text-lg">E</div>
                <div class="flex flex-col">
                    <span class="font-extrabold text-sm tracking-tight text-white uppercase leading-none">Evanex Admin</span>
                    <span class="text-[9px] font-bold text-teal-400 uppercase tracking-widest mt-0.5">Content Manager</span>
                </div>
            </div>
            
            <?php if ($is_logged_in): ?>
            <div class="flex items-center gap-4">
                <a href="/" target="_blank" class="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1">
                    <span>View Website</span>
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                </a>
                <a href="admin.php?action=logout" class="bg-slate-900 hover:bg-red-950/50 text-slate-300 hover:text-red-400 border border-slate-800 hover:border-red-900 px-3 py-1.5 rounded-xl text-xs font-bold transition-all">
                    Logout
                </a>
            </div>
            <?php endif; ?>
        </div>
    </header>

    <!-- Main Container -->
    <main class="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex flex-col items-center justify-center">

        <!-- Alerts -->
        <?php if (isset($_GET['success'])): ?>
            <div class="w-full max-w-4xl mb-6 bg-teal-950/40 border border-teal-500/50 text-teal-300 p-4 rounded-2xl flex items-center gap-3 animate-pulse">
                <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <span class="text-xs font-semibold">
                    <?php 
                        if ($_GET['success'] === 'setup') echo "Administrator account initialized successfully!";
                        if ($_GET['success'] === 'save') echo "Website content updated successfully! Reload your site to view changes.";
                    ?>
                </span>
            </div>
        <?php endif; ?>

        <?php if (isset($error)): ?>
            <div class="w-full max-w-4xl mb-6 bg-red-950/40 border border-red-500/50 text-red-300 p-4 rounded-2xl flex items-center gap-3">
                <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                <span class="text-xs font-semibold"><?php echo $error; ?></span>
            </div>
        <?php endif; ?>

        <!-- SETUP FORM -->
        <?php if ($is_setup_needed): ?>
            <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl space-y-6">
                <div class="text-center space-y-2">
                    <h2 class="text-2xl font-black text-white uppercase tracking-tight">Create Admin Password</h2>
                    <p class="text-xs text-slate-400">Set up a master password to manage your Evanex Pharmacy website content. Please store it securely.</p>
                </div>
                <form method="POST" action="admin.php" class="space-y-4">
                    <input type="hidden" name="action" value="setup">
                    
                    <div class="space-y-1">
                        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enter Password</label>
                        <input type="password" name="password" required class="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500 transition-colors">
                    </div>

                    <div class="space-y-1">
                        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confirm Password</label>
                        <input type="password" name="confirm_password" required class="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500 transition-colors">
                    </div>

                    <button type="submit" class="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-4 rounded-2xl transition-all shadow-lg hover:shadow-teal-500/10 text-sm">
                        Create Account
                    </button>
                </form>
            </div>

        <!-- LOGIN FORM -->
        <?php elseif (!$is_logged_in): ?>
            <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl space-y-6">
                <div class="text-center space-y-2">
                    <h2 class="text-2xl font-black text-white uppercase tracking-tight">Administrator Login</h2>
                    <p class="text-xs text-slate-400">Sign in to change site headers, images, wings, and news events.</p>
                </div>
                <form method="POST" action="admin.php" class="space-y-4">
                    <input type="hidden" name="action" value="login">
                    
                    <div class="space-y-1">
                        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Master Password</label>
                        <input type="password" name="password" required placeholder="••••••••" class="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500 transition-colors">
                    </div>

                    <button type="submit" class="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-4 rounded-2xl transition-all shadow-lg hover:shadow-teal-500/10 text-sm">
                        Access Dashboard
                    </button>
                </form>
            </div>

        <!-- CMS DASHBOARD -->
        <?php else: ?>
            <form id="cms-form" method="POST" action="admin.php" enctype="multipart/form-data" class="w-full max-w-5xl flex flex-col lg:flex-row gap-8 items-start">
                <input type="hidden" name="action" value="save">
                <input type="hidden" name="csrf_token" value="<?php echo $_SESSION['csrf_token']; ?>">
                <input type="hidden" name="news_json" id="news_json_input">

                <!-- Sidebar Navigation (Tabs) -->
                <div class="w-full lg:w-64 bg-slate-900 border border-slate-800 rounded-3xl p-4 shrink-0 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible custom-scrollbar">
                    <button type="button" onclick="switchTab('hero')" id="tab-btn-hero" class="tab-btn w-full text-left px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap bg-teal-500 text-white">
                        🚀 Homepage Hero
                    </button>
                    <button type="button" onclick="switchTab('ceo')" id="tab-btn-ceo" class="tab-btn w-full text-left px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap text-slate-400 hover:text-white hover:bg-slate-800/50">
                        👨 CEO Message
                    </button>
                    <button type="button" onclick="switchTab('services')" id="tab-btn-services" class="tab-btn w-full text-left px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap text-slate-400 hover:text-white hover:bg-slate-800/50">
                        🏥 Healthcare Wings
                    </button>
                    <button type="button" onclick="switchTab('news')" id="tab-btn-news" class="tab-btn w-full text-left px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap text-slate-400 hover:text-white hover:bg-slate-800/50">
                        📰 News & Campaigns
                    </button>
                    <button type="button" onclick="switchTab('contact')" id="tab-btn-contact" class="tab-btn w-full text-left px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap text-slate-400 hover:text-white hover:bg-slate-800/50">
                        📞 Contact & Hours
                    </button>
                </div>

                <!-- Editor Form Content Area -->
                <div class="flex-grow w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-8">
                    
                    <!-- TAB: HERO -->
                    <div id="tab-hero" class="tab-content space-y-6">
                        <div class="border-b border-slate-800 pb-4">
                            <h3 class="text-xl font-bold text-white">Homepage Hero Section</h3>
                            <p class="text-xs text-slate-400">Manage the first thing users see on the website: title, description, and storefront backdrop.</p>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="space-y-4">
                                <div class="space-y-1">
                                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Live Badge</label>
                                    <input type="text" name="hero_badge" value="<?php echo htmlspecialchars($content['hero']['badge'] ?? ''); ?>" class="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500 transition-colors">
                                </div>
                                <div class="space-y-1">
                                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Main Headline Title</label>
                                    <input type="text" name="hero_title" value="<?php echo htmlspecialchars($content['hero']['title'] ?? ''); ?>" class="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500 transition-colors">
                                </div>
                                <div class="space-y-1">
                                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subtitle Description</label>
                                    <textarea name="hero_description" rows="4" class="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500 transition-colors leading-relaxed"><?php echo htmlspecialchars($content['hero']['description'] ?? ''); ?></textarea>
                                </div>
                            </div>
                            
                            <div class="space-y-4">
                                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Background Banner Image</label>
                                <?php if (!empty($content['hero']['bgImage'])): ?>
                                    <div class="relative rounded-2xl overflow-hidden aspect-[16/9] border border-slate-800 bg-slate-950">
                                        <img src="<?php echo $content['hero']['bgImage']; ?>" class="w-full h-full object-cover" alt="Hero Background">
                                    </div>
                                <?php endif; ?>
                                <div class="bg-slate-950 border border-slate-800 border-dashed rounded-2xl p-4 text-center hover:border-teal-500 transition-colors">
                                    <input type="file" name="hero_bgImage" id="hero_bgImage" class="hidden">
                                    <label for="hero_bgImage" class="cursor-pointer text-xs text-slate-400 hover:text-white flex flex-col items-center gap-1">
                                        <span>📁 Click here to upload replacement image</span>
                                        <span class="text-[9px] text-slate-500">Allowed types: JPEG, PNG, WEBP</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- TAB: CEO -->
                    <div id="tab-ceo" class="tab-content hidden space-y-6">
                        <div class="border-b border-slate-800 pb-4">
                            <h3 class="text-xl font-bold text-white">CEO Message & Profile</h3>
                            <p class="text-xs text-slate-400">Update Mr. Evans Ghartey's portrait photo, exact role, and his signed introductory quote statement.</p>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="space-y-4">
                                <div class="space-y-1">
                                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CEO Name</label>
                                    <input type="text" name="ceo_name" value="<?php echo htmlspecialchars($content['ceo']['name'] ?? ''); ?>" class="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500 transition-colors">
                                </div>
                                <div class="space-y-1">
                                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CEO Title / Role</label>
                                    <input type="text" name="ceo_role" value="<?php echo htmlspecialchars($content['ceo']['role'] ?? ''); ?>" class="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500 transition-colors">
                                </div>
                                <div class="space-y-1">
                                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Message Quote</label>
                                    <textarea name="ceo_quote" rows="6" class="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500 transition-colors leading-relaxed"><?php echo htmlspecialchars($content['ceo']['quote'] ?? ''); ?></textarea>
                                </div>
                            </div>
                            
                            <div class="space-y-4">
                                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">CEO Portrait Photo</label>
                                <?php if (!empty($content['ceo']['image'])): ?>
                                    <div class="relative rounded-2xl overflow-hidden aspect-[4/5] max-w-[240px] mx-auto border border-slate-800 bg-slate-950">
                                        <img src="<?php echo $content['ceo']['image']; ?>" class="w-full h-full object-cover" alt="CEO Portrait">
                                    </div>
                                <?php endif; ?>
                                <div class="bg-slate-950 border border-slate-800 border-dashed rounded-2xl p-4 text-center hover:border-teal-500 transition-colors max-w-[240px] mx-auto">
                                    <input type="file" name="ceo_image" id="ceo_image" class="hidden">
                                    <label for="ceo_image" class="cursor-pointer text-xs text-slate-400 hover:text-white flex flex-col items-center gap-1">
                                        <span>📁 Upload CEO Image</span>
                                        <span class="text-[9px] text-slate-500">Allowed types: JPEG, PNG, WEBP</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- TAB: SERVICES -->
                    <div id="tab-services" class="tab-content hidden space-y-8">
                        <div class="border-b border-slate-800 pb-4">
                            <h3 class="text-xl font-bold text-white">Healthcare Service Wings</h3>
                            <p class="text-xs text-slate-400">Edit content for each of the three main service categories: Pharmacy, Labs, and Ultrasound Scan Center.</p>
                        </div>
                        
                        <!-- Pharmacy Card -->
                        <div class="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4">
                            <h4 class="text-sm font-bold text-teal-400 uppercase tracking-wider">1. Community Pharmacy Wing</h4>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div class="space-y-3">
                                    <div class="space-y-1">
                                        <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Title</label>
                                        <input type="text" name="pharmacy_title" value="<?php echo htmlspecialchars($content['services']['pharmacy']['title'] ?? ''); ?>" class="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2 text-xs text-white focus:outline-none focus:border-teal-500 transition-colors">
                                    </div>
                                    <div class="space-y-1">
                                        <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Description</label>
                                        <textarea name="pharmacy_description" rows="3" class="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2 text-xs text-white focus:outline-none focus:border-teal-500 transition-colors leading-relaxed"><?php echo htmlspecialchars($content['services']['pharmacy']['description'] ?? ''); ?></textarea>
                                    </div>
                                </div>
                                <div class="flex items-center gap-4">
                                    <?php if (!empty($content['services']['pharmacy']['image'])): ?>
                                        <div class="w-24 h-24 rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shrink-0">
                                            <img src="<?php echo $content['services']['pharmacy']['image']; ?>" class="w-full h-full object-cover" alt="Pharmacy Wing">
                                        </div>
                                    <?php endif; ?>
                                    <div class="bg-slate-900 border border-slate-800 border-dashed rounded-2xl p-3 text-center hover:border-teal-500 transition-colors flex-grow">
                                        <input type="file" name="pharmacy_image" id="pharmacy_image" class="hidden">
                                        <label for="pharmacy_image" class="cursor-pointer text-[10px] text-slate-400 hover:text-white flex flex-col items-center">
                                            <span>📁 Upload Image</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Lab Card -->
                        <div class="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4">
                            <h4 class="text-sm font-bold text-teal-400 uppercase tracking-wider">2. Clinical Laboratory Wing</h4>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div class="space-y-3">
                                    <div class="space-y-1">
                                        <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Title</label>
                                        <input type="text" name="laboratory_title" value="<?php echo htmlspecialchars($content['services']['laboratory']['title'] ?? ''); ?>" class="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2 text-xs text-white focus:outline-none focus:border-teal-500 transition-colors">
                                    </div>
                                    <div class="space-y-1">
                                        <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Description</label>
                                        <textarea name="laboratory_description" rows="3" class="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2 text-xs text-white focus:outline-none focus:border-teal-500 transition-colors leading-relaxed"><?php echo htmlspecialchars($content['services']['laboratory']['description'] ?? ''); ?></textarea>
                                    </div>
                                </div>
                                <div class="flex items-center gap-4">
                                    <?php if (!empty($content['services']['laboratory']['image'])): ?>
                                        <div class="w-24 h-24 rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shrink-0">
                                            <img src="<?php echo $content['services']['laboratory']['image']; ?>" class="w-full h-full object-cover" alt="Lab Wing">
                                        </div>
                                    <?php endif; ?>
                                    <div class="bg-slate-900 border border-slate-800 border-dashed rounded-2xl p-3 text-center hover:border-teal-500 transition-colors flex-grow">
                                        <input type="file" name="laboratory_image" id="laboratory_image" class="hidden">
                                        <label for="laboratory_image" class="cursor-pointer text-[10px] text-slate-400 hover:text-white flex flex-col items-center">
                                            <span>📁 Upload Image</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Scan Centre Card -->
                        <div class="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4">
                            <h4 class="text-sm font-bold text-teal-400 uppercase tracking-wider">3. Ultrasound Scan Wing</h4>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div class="space-y-3">
                                    <div class="space-y-1">
                                        <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Title</label>
                                        <input type="text" name="scanCentre_title" value="<?php echo htmlspecialchars($content['services']['scanCentre']['title'] ?? ''); ?>" class="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2 text-xs text-white focus:outline-none focus:border-teal-500 transition-colors">
                                    </div>
                                    <div class="space-y-1">
                                        <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Description</label>
                                        <textarea name="scanCentre_description" rows="3" class="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2 text-xs text-white focus:outline-none focus:border-teal-500 transition-colors leading-relaxed"><?php echo htmlspecialchars($content['services']['scanCentre']['description'] ?? ''); ?></textarea>
                                    </div>
                                </div>
                                <div class="flex items-center gap-4">
                                    <?php if (!empty($content['services']['scanCentre']['image'])): ?>
                                        <div class="w-24 h-24 rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shrink-0">
                                            <img src="<?php echo $content['services']['scanCentre']['image']; ?>" class="w-full h-full object-cover" alt="Scan Wing">
                                        </div>
                                    <?php endif; ?>
                                    <div class="bg-slate-900 border border-slate-800 border-dashed rounded-2xl p-3 text-center hover:border-teal-500 transition-colors flex-grow">
                                        <input type="file" name="scanCentre_image" id="scanCentre_image" class="hidden">
                                        <label for="scanCentre_image" class="cursor-pointer text-[10px] text-slate-400 hover:text-white flex flex-col items-center">
                                            <span>📁 Upload Image</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- TAB: NEWS -->
                    <div id="tab-news" class="tab-content hidden space-y-6">
                        <div class="border-b border-slate-800 pb-4 flex items-center justify-between">
                            <div>
                                <h3 class="text-xl font-bold text-white">News, Announcements & Events</h3>
                                <p class="text-xs text-slate-400">Add, remove, or modify upcoming health campaigns, distribution reports, or facility notices.</p>
                            </div>
                            <button type="button" onclick="addArticle()" class="bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors">
                                + Add Article
                            </button>
                        </div>
                        
                        <div id="articles-list-container" class="space-y-4">
                            <!-- JS will inject dynamic article rows here -->
                        </div>
                    </div>

                    <!-- TAB: CONTACT -->
                    <div id="tab-contact" class="tab-content hidden space-y-6">
                        <div class="border-b border-slate-800 pb-4">
                            <h3 class="text-xl font-bold text-white">Contact Info & Working Hours</h3>
                            <p class="text-xs text-slate-400">Set active phone hotlines, official email channels, business operation hours, and street address.</p>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="space-y-1">
                                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Office Address</label>
                                <input type="text" name="contact_address" value="<?php echo htmlspecialchars($content['contact']['address'] ?? ''); ?>" class="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500 transition-colors">
                            </div>

                            <div class="space-y-1">
                                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone Hotlines (separated by slash)</label>
                                <input type="text" name="contact_phones" value="<?php echo htmlspecialchars($content['contact']['phones'] ?? ''); ?>" class="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500 transition-colors">
                            </div>

                            <div class="space-y-1">
                                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Channel</label>
                                <input type="email" name="contact_email" value="<?php echo htmlspecialchars($content['contact']['email'] ?? ''); ?>" class="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500 transition-colors">
                            </div>

                            <div class="space-y-1">
                                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Working Hours Label</label>
                                <input type="text" name="contact_hours" value="<?php echo htmlspecialchars($content['contact']['hours'] ?? ''); ?>" class="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500 transition-colors">
                            </div>
                        </div>
                    </div>

                    <!-- Bottom Bar (Actions) -->
                    <div class="border-t border-slate-800 pt-6 flex items-center justify-between">
                        <span class="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Changes deploy instantly</span>
                        <button type="submit" class="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-8 rounded-2xl transition-all shadow-lg hover:shadow-teal-500/15 text-xs tracking-wider uppercase">
                            Save Page Changes
                        </button>
                    </div>

                </div>
            </form>
        <?php endif; ?>

    </main>

    <!-- Footer -->
    <footer class="border-t border-slate-900 bg-slate-950 py-4 text-center text-[10px] text-slate-600">
        <p>&copy; <?php echo date('Y'); ?> Evanex Pharmacy. Visual CMS V1.0 - Private Platform.</p>
    </footer>

    <?php if ($is_logged_in): ?>
    <script>
        // Tab switching logic
        function switchTab(tabId) {
            // Hide all tab contents
            document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
            // Remove active classes from tab buttons
            document.querySelectorAll('.tab-btn').forEach(el => {
                el.classList.remove('bg-teal-500', 'text-white');
                el.classList.add('text-slate-400', 'hover:text-white', 'hover:bg-slate-800/50');
            });

            // Show selected tab content
            document.getElementById('tab-' + tabId).classList.remove('hidden');
            // Add active styling to clicked button
            const activeBtn = document.getElementById('tab-btn-' + tabId);
            activeBtn.classList.remove('text-slate-400', 'hover:text-white', 'hover:bg-slate-800/50');
            activeBtn.classList.add('bg-teal-500', 'text-white');
        }

        // Initialize News list editor
        let newsArticles = <?php echo json_encode($content['news'] ?? []); ?>;

        function renderArticles() {
            const container = document.getElementById('articles-list-container');
            container.innerHTML = '';
            
            if (newsArticles.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-8 bg-slate-950 border border-slate-850 rounded-2xl text-slate-500 text-xs">
                        No articles posted yet. Click "+ Add Article" to write one.
                    </div>
                `;
                return;
            }

            newsArticles.forEach((art, idx) => {
                const row = document.createElement('div');
                row.className = "bg-slate-950 border border-slate-850 rounded-3xl p-5 space-y-4 relative group";
                row.innerHTML = `
                    <button type="button" onclick="removeArticle(${idx})" class="absolute top-4 right-4 text-slate-500 hover:text-red-400 text-xs font-bold transition-colors">
                        Delete
                    </button>
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div class="space-y-1">
                            <label class="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Publish Date</label>
                            <input type="text" oninput="updateArticleField(${idx}, 'date', this.value)" value="${escapeHtml(art.date || '')}" placeholder="June 2, 2026" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none">
                        </div>
                        <div class="space-y-1">
                            <label class="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Tag / Category</label>
                            <input type="text" oninput="updateArticleField(${idx}, 'tag', this.value)" value="${escapeHtml(art.tag || '')}" placeholder="Outreach" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none">
                        </div>
                        <div class="space-y-1 col-span-2">
                            <label class="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Article Title</label>
                            <input type="text" oninput="updateArticleField(${idx}, 'title', this.value)" value="${escapeHtml(art.title || '')}" placeholder="Free Screening Campaign" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none">
                        </div>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-5 gap-4">
                        <div class="space-y-1 sm:col-span-4">
                            <label class="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Brief Description</label>
                            <input type="text" oninput="updateArticleField(${idx}, 'desc', this.value)" value="${escapeHtml(art.desc || '')}" placeholder="Evanex is distributing mosquito nets..." class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none">
                        </div>
                        <div class="space-y-1">
                            <label class="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Emoji Icon</label>
                            <input type="text" oninput="updateArticleField(${idx}, 'icon', this.value)" value="${escapeHtml(art.icon || '🩺')}" placeholder="🩺" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none text-center">
                        </div>
                    </div>
                `;
                container.appendChild(row);
            });
        }

        function addArticle() {
            newsArticles.unshift({
                date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
                tag: 'Campaign',
                title: 'New Announcement',
                desc: 'Write details here...',
                icon: '📢'
            });
            renderArticles();
            saveToHiddenInput();
        }

        function removeArticle(index) {
            if (confirm("Are you sure you want to delete this news article?")) {
                newsArticles.splice(index, 1);
                renderArticles();
                saveToHiddenInput();
            }
        }

        function updateArticleField(index, field, value) {
            newsArticles[index][field] = value;
            saveToHiddenInput();
        }

        function saveToHiddenInput() {
            document.getElementById('news_json_input').value = JSON.stringify(newsArticles);
        }

        function escapeHtml(text) {
            return text
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

        // Before form submission, make sure latest JS newsArticles are written to the hidden input
        document.getElementById('cms-form').addEventListener('submit', function() {
            saveToHiddenInput();
        });

        // Initialize News tab
        renderArticles();
        saveToHiddenInput();
    </script>
    <?php endif; ?>

</body>
</html>
