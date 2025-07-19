const { pool } = require('./db');

async function fixModuleLabs() {
    try {
        console.log('🔧 Fixing module-labs relationships...');

        // Check current state
        const modules = await pool.query('SELECT id, title FROM modules WHERE course_id = 14 ORDER BY order_index');
        const labs = await pool.query('SELECT id, title FROM labs');
        const existingRelations = await pool.query('SELECT * FROM module_labs');

        console.log('📖 Modules in course 14:');
        modules.rows.forEach(m => console.log(`  - ${m.id}: ${m.title}`));

        console.log('\n🧪 Available labs:');
        labs.rows.forEach(l => console.log(`  - ${l.id}: ${l.title}`));

        console.log('\n🔗 Existing module-labs relations:', existingRelations.rows.length);

        // Based on the logs, module 152 should have lab 122
        // Let's check if lab 122 exists and link it to module 152
        const firstModule = modules.rows.find(m => m.title.includes('First Module'));
        const artLab = labs.rows.find(l => l.title.includes('Art and science'));

        if (firstModule && artLab) {
            console.log(`\n🔗 Linking lab ${artLab.id} (${artLab.title}) to module ${firstModule.id} (${firstModule.title})`);

            try {
                await pool.query(
                    'INSERT INTO module_labs (module_id, lab_id, order_index) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
                    [firstModule.id, artLab.id, 0]
                );
                console.log('✅ Successfully linked lab to module');
            } catch (error) {
                console.log('❌ Failed to link lab to module:', error.message);
            }
        }

        // Check final state
        const finalRelations = await pool.query('SELECT ml.*, m.title as module_title, l.title as lab_title FROM module_labs ml JOIN modules m ON ml.module_id = m.id JOIN labs l ON ml.lab_id = l.id');
        console.log('\n🎉 Final module-labs relationships:');
        finalRelations.rows.forEach(rel => {
            console.log(`  - ${rel.module_title} <-> ${rel.lab_title} (order: ${rel.order_index})`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit();
    }
}

fixModuleLabs();
