from django.db import models

class MachineSetting(models.Model):
    auto_s1_speed = models.FloatField()
    auto_s1_acc = models.IntegerField()
    auto_s1_dec = models.IntegerField()
    auto_s1_single_step = models.FloatField()
    auto_s1_last_step = models.FloatField()
    no_of_roll = models.IntegerField()
    product_count_pcs = models.IntegerField()
    product_count_set = models.IntegerField()

    def __str__(self):
        return f"Machine Setting {self.id}"
